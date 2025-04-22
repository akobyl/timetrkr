// Wait for the DOM to be fully loaded before creating the Vue app
// Utility functions for date calculations
const getDateRanges = {
    // Get the start and end of the current week (Monday through Sunday)
    getCurrentWeekRange() {
        const today = new Date();
        const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ...
        
        // Calculate days to subtract to get to Monday
        // If today is Sunday (0), go back 6 days
        // If today is Monday (1), go back 0 days, etc.
        const daysToSubtract = currentDay === 0 ? 6 : currentDay - 1;
        
        // Create a new date object for start of week (Monday)
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - daysToSubtract);
        
        // Calculate end of week (Sunday)
        // If today is already Sunday, use today
        // Otherwise, add days needed to reach Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to Monday to get to Sunday
        
        // Reset the time parts to ensure consistent comparison
        startOfWeek.setHours(0, 0, 0, 0);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Format as YYYY-MM-DD strings
        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = endOfWeek.toISOString().split('T')[0];
        
        return {
            start: startStr,
            end: endStr,
            startDate: startOfWeek,
            endDate: endOfWeek
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const app = Vue.createApp({
        data() {
            return {
                // Auth state
                isAuthenticated: false,
                authError: null,
                showRegisterForm: false,
                loginForm: {
                    username: '',
                    password: ''
                },
                registerForm: {
                    username: '',
                    password: ''
                },
                
                // UI state
                activeTab: 'dashboard',
                
                // Dashboard tab
                currentEntry: {
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',  // 9:00 AM in 24-hour format
                    endTime: '17:00'     // 5:00 PM in 24-hour format
                },
                todayEntries: [],
                weekEntries: [],
                filterDate: new Date().toISOString().split('T')[0],
                editingEntry: null,
                todaySummary: null,
                weekSummary: null,
                
                // All Entries tab
                allTimeEntries: [],
                filterMonth: new Date().toISOString().slice(0, 7),  // YYYY-MM format
                editingTimeEntry: null,
                totalMinutesForAllEntries: 0,
                uniqueDaysForAllEntries: 0
            };
        },
        mounted() {
            // Check if user is already authenticated
            const token = localStorage.getItem('token');
            if (token) {
                this.isAuthenticated = true;
                this.loadTimeEntries();
                // Only load all entries if we're on that tab to save bandwidth
                if (this.activeTab === 'allEntries') {
                    this.loadAllTimeEntries();
                }
            }
            
            // Add a watcher for tab changes to load data when tab changes
            this.$watch('activeTab', (newTab) => {
                if (newTab === 'allEntries' && this.isAuthenticated) {
                    this.loadAllTimeEntries();
                } else if (newTab === 'dashboard' && this.isAuthenticated) {
                    this.loadTimeEntries();
                }
            });
        },
        
        // Computed properties
        computed: {
            // Simple property to ensure entries display
            displayEntries() {
                // Return the array or empty array if it's not valid
                const entries = this.allTimeEntries;
                console.log("Computing displayEntries:", entries);
                return Array.isArray(entries) ? entries : [];
            }
        },
        methods: {
            async login() {
                try {
                    this.authError = null;
                    const formData = new FormData();
                    formData.append('username', this.loginForm.username);
                    formData.append('password', this.loginForm.password);
                    
                    const response = await axios.post('/token', formData);
                    localStorage.setItem('token', response.data.access_token);
                    this.isAuthenticated = true;
                    this.loadTimeEntries();
                } catch (error) {
                    this.authError = error.response?.data?.detail || 'Login failed';
                    console.error('Login error:', error);
                }
            },
            
            async register() {
                try {
                    this.authError = null;
                    console.log('Attempting to register with:', {
                        username: this.registerForm.username,
                        password: this.registerForm.password.length + ' chars'
                    });
                    
                    const response = await axios.post('/users/', {
                        username: this.registerForm.username,
                        password: this.registerForm.password
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    console.log('Registration successful:', response.data);
                    
                    // Auto login after registration
                    this.loginForm.username = this.registerForm.username;
                    this.loginForm.password = this.registerForm.password;
                    this.showRegisterForm = false;
                    await this.login();
                } catch (error) {
                    console.error('Registration error details:', {
                        status: error.response?.status,
                        data: error.response?.data,
                        message: error.message
                    });
                    this.authError = error.response?.data?.detail || 'Registration failed';
                }
            },
            
            logout() {
                localStorage.removeItem('token');
                this.isAuthenticated = false;
                
                // Clear all data
                this.todayEntries = [];
                this.weekEntries = [];
                this.todaySummary = null;
                this.weekSummary = null;
                this.allTimeEntries = [];
                this.totalMinutesForAllEntries = 0;
                this.uniqueDaysForAllEntries = 0;
                
                // Reset to dashboard tab
                this.activeTab = 'dashboard';
            },
            
            async loadTimeEntries() {
                try {
                    console.log('Loading time entries and summaries...');
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    // Get today's date
                    const today = new Date().toISOString().split('T')[0];
                    
                    // Load today's entries
                    const todayResponse = await axios.get('/time-entries/', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { entry_date: today }
                    });
                    
                    this.todayEntries = todayResponse.data;
                    console.log(`Loaded ${this.todayEntries.length} entries for today:`, this.todayEntries);
                    
                    // Get today's summary
                    const todaySummaryResponse = await axios.get('/time-summary/', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { 
                            start_date: today,
                            end_date: today
                        }
                    });
                    
                    this.todaySummary = todaySummaryResponse.data;
                    console.log('Today summary:', this.todaySummary);
                    
                    // Get the current week's date range (Monday to Sunday)
                    const weekRange = getDateRanges.getCurrentWeekRange();
                    const startOfWeekStr = weekRange.start;
                    const endOfWeekStr = weekRange.end;
                    
                    console.log(`Full week range: ${startOfWeekStr} to ${endOfWeekStr}`);
                    console.log(`Week start: ${weekRange.startDate.toDateString()}`);
                    console.log(`Week end: ${weekRange.endDate.toDateString()}`);
                    
                    // Load all entries (no date filter) then filter client-side
                    const allEntriesResponse = await axios.get('/time-entries/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    console.log(`Loaded ${allEntriesResponse.data.length} total entries:`, allEntriesResponse.data);
                    
                    // DEBUG: Let's check what entries we have for the whole week
                    for (const entry of allEntriesResponse.data) {
                        console.log(`Entry: date=${entry.date}, start=${entry.start_time}, end=${entry.end_time}`);
                    }
                    
                    // Filter entries from the full week and sort by date
                    this.weekEntries = allEntriesResponse.data
                        .filter(entry => {
                            const entryDate = String(entry.date);
                            console.log(`Entry date: ${entryDate}, Week range: ${startOfWeekStr} - ${endOfWeekStr}`);
                            
                            // String comparison for ISO formatted dates (YYYY-MM-DD)
                            const isInWeek = entryDate >= startOfWeekStr && entryDate <= endOfWeekStr;
                            console.log(`- In week: ${isInWeek}`);
                            return isInWeek;
                        })
                        .sort((a, b) => {
                            // Sort by date ascending and then by start time
                            if (a.date !== b.date) {
                                return a.date < b.date ? -1 : 1;
                            }
                            return a.start_time < b.start_time ? -1 : 1;
                        });
                    
                    console.log(`Filtered to ${this.weekEntries.length} entries for this week:`, this.weekEntries);
                    
                    // Get weekly summary for the full week
                    const weekSummaryResponse = await axios.get('/time-summary/', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { 
                            start_date: startOfWeekStr,
                            end_date: endOfWeekStr
                        }
                    });
                    
                    console.log(`Weekly summary request for full week: ${startOfWeekStr} to ${endOfWeekStr}`);
                    
                    this.weekSummary = weekSummaryResponse.data;
                    console.log('Week summary:', this.weekSummary);
                    
                } catch (error) {
                    console.error('Error loading time entries:', error);
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                }
            },
            
            async saveTimeEntry() {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const payload = {
                        date: this.currentEntry.date,
                        start_time: this.currentEntry.startTime,
                        end_time: this.currentEntry.endTime
                    };
                    
                    console.log('Saving time entry:', payload);
                    
                    if (this.editingEntry) {
                        await axios.put(`/time-entries/${this.editingEntry}`, payload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        this.editingEntry = null;
                    } else {
                        await axios.post('/time-entries/', payload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                    }
                    
                    this.resetForm();
                    
                    // Force a complete reload of all time entries and summaries
                    await this.loadTimeEntries();
                    
                    // If All Entries tab is visible, update it too
                    if (this.activeTab === 'allEntries') {
                        await this.loadAllTimeEntries();
                    }
                } catch (error) {
                    console.error('Error saving time entry:', error);
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                }
            },
            
            async deleteTimeEntry(id) {
                if (!confirm('Are you sure you want to delete this time entry?')) return;
                
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    await axios.delete(`/time-entries/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    // Reload data based on active tab
                    if (this.activeTab === 'dashboard') {
                        await this.loadTimeEntries();
                    } else if (this.activeTab === 'allEntries') {
                        await this.loadAllTimeEntries();
                    }
                    
                    // If we're in All Entries tab but need to update Dashboard data too
                    if (this.activeTab === 'allEntries') {
                        await this.loadTimeEntries();
                    }
                } catch (error) {
                    console.error('Error deleting time entry:', error);
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                }
            },
            
            resetForm() {
                this.currentEntry = {
                    date: new Date().toISOString().split('T')[0],
                    startTime: '09:00',  // 9:00 AM in 24-hour format
                    endTime: '17:00'     // 5:00 PM in 24-hour format
                };
                this.editingEntry = null;
            },
            
            adjustTime(type, minutes) {
                const timeField = type === 'start' ? 'startTime' : 'endTime';
                const currentTime = this.currentEntry[timeField];
                
                // Parse the time
                const [hours, mins] = currentTime.split(':').map(Number);
                
                // Calculate new time
                let totalMinutes = hours * 60 + mins + minutes;
                if (totalMinutes < 0) totalMinutes = 0;
                if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1;
                
                const newHours = Math.floor(totalMinutes / 60);
                const newMinutes = totalMinutes % 60;
                
                // Format back to 24-hour format (HH:MM)
                this.currentEntry[timeField] = 
                    `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            },
            
            setTimeToNow(type) {
                const timeField = type === 'start' ? 'startTime' : 'endTime';
                const now = new Date();
                
                // Get hours and minutes
                let hours = now.getHours();
                let minutes = now.getMinutes();
                
                // Round to nearest 15 minutes
                minutes = Math.round(minutes / 15) * 15;
                
                // Adjust if minutes rolled over to 60
                if (minutes === 60) {
                    minutes = 0;
                    hours = (hours + 1) % 24;  // Ensure we don't go past 24 hours
                }
                
                // Format back to 24-hour format (HH:MM)
                this.currentEntry[timeField] = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                
                console.log(`Set ${type} time to current time (rounded to nearest 15 min): ${this.currentEntry[timeField]}`);
            },
            
            formatDate(dateStr) {
                const date = new Date(dateStr);
                return date.toLocaleDateString();
            },
            
            formatTime(timeStr) {
                // Ensure time is displayed in 24-hour format
                return timeStr;
            },
            
            formatMinutes(totalMinutes) {
                const hours = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                return `${hours}h ${mins}m`;
            },
            
            calculateDuration(startTime, endTime) {
                const [startHours, startMins] = startTime.split(':').map(Number);
                const [endHours, endMins] = endTime.split(':').map(Number);
                
                let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins);
                if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
                
                const hours = Math.floor(durationMinutes / 60);
                const mins = durationMinutes % 60;
                return `${hours}h ${mins}m`;
            },
            
            // --- All Entries Tab Methods ---
            
            async loadAllTimeEntries() {
                try {
                    // Reset all entries to a clean array first
                    this.allTimeEntries = [];
                    this.totalMinutesForAllEntries = 0;
                    this.uniqueDaysForAllEntries = 0;
                    
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    console.log(`Loading all time entries for ${this.filterMonth}...`);
                    
                    // Simplify by making a direct API call
                    const response = await axios.get('/time-entries/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    // Get the raw data
                    const rawEntries = response.data;
                    console.log(`Loaded ${rawEntries.length} entries from API:`, rawEntries);
                    
                    // Filter and prepare entries - simplified code
                    let processedEntries = rawEntries;
                    
                    // Filter by month if needed
                    if (this.filterMonth && this.filterMonth.length > 0) {
                        processedEntries = rawEntries.filter(entry => {
                            // Ensure we have a string for comparison
                            const entryDate = String(entry.date || '');
                            const result = entryDate.startsWith(this.filterMonth);
                            console.log(`Entry ${entry.id}: ${entryDate} matches ${this.filterMonth}? ${result}`);
                            return result;
                        });
                    }
                    
                    // Group by date and sort (newest first)
                    processedEntries.sort((a, b) => {
                        // First compare by date (newest first)
                        if (a.date !== b.date) {
                            return String(a.date) < String(b.date) ? 1 : -1;
                        }
                        // Then by start time (earliest first)
                        return String(a.start_time) > String(b.start_time) ? 1 : -1;
                    });
                    
                    // Calculate totals
                    let totalMinutes = 0;
                    const uniqueDays = new Set();
                    
                    processedEntries.forEach(entry => {
                        // Track unique days
                        if (entry.date) {
                            uniqueDays.add(entry.date);
                        }
                        
                        // Calculate duration if we have times
                        if (entry.start_time && entry.end_time) {
                            const [startHours, startMins] = entry.start_time.split(':').map(Number);
                            const [endHours, endMins] = entry.end_time.split(':').map(Number);
                            
                            let duration = (endHours * 60 + endMins) - (startHours * 60 + startMins);
                            if (duration < 0) duration += 24 * 60;
                            
                            totalMinutes += duration;
                        }
                    });
                    
                    // Update our data properties in one go
                    this.totalMinutesForAllEntries = totalMinutes;
                    this.uniqueDaysForAllEntries = uniqueDays.size;
                    this.allTimeEntries = processedEntries; 
                    
                    console.log(`Final processed entries: ${this.allTimeEntries.length}`);
                    
                    // Force a UI update
                    this.$forceUpdate();
                    
                } catch (error) {
                    console.error('Error loading all time entries:', error);
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                }
            },
            
            calculateTotalsForAllEntries() {
                let totalMinutes = 0;
                const uniqueDays = new Set();
                
                this.allTimeEntries.forEach(entry => {
                    // Parse times
                    const [startHours, startMins] = entry.start_time.split(':').map(Number);
                    const [endHours, endMins] = entry.end_time.split(':').map(Number);
                    
                    // Calculate duration
                    let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins);
                    if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
                    
                    // Add to total
                    totalMinutes += durationMinutes;
                    
                    // Add date to unique days set
                    uniqueDays.add(entry.date);
                });
                
                this.totalMinutesForAllEntries = totalMinutes;
                this.uniqueDaysForAllEntries = uniqueDays.size;
            },
            
            debugShowEntries() {
                console.log("=== DEBUG ENTRIES ===");
                console.log("Active Tab:", this.activeTab);
                console.log("All Entries Length:", this.allTimeEntries.length);
                if (this.allTimeEntries.length > 0) {
                    console.log("First Entry:", this.allTimeEntries[0]);
                    console.log("Entry Type:", typeof this.allTimeEntries);
                    
                    // Create a temporary div to display entries
                    const div = document.createElement('div');
                    div.style.position = 'fixed';
                    div.style.top = '10px';
                    div.style.right = '10px';
                    div.style.backgroundColor = 'white';
                    div.style.padding = '20px';
                    div.style.border = '1px solid black';
                    div.style.zIndex = '9999';
                    div.style.maxHeight = '80vh';
                    div.style.overflow = 'auto';
                    
                    // Add close button
                    const closeBtn = document.createElement('button');
                    closeBtn.innerText = 'Close';
                    closeBtn.onclick = () => document.body.removeChild(div);
                    div.appendChild(closeBtn);
                    
                    // Add entries
                    const entriesInfo = document.createElement('pre');
                    entriesInfo.textContent = JSON.stringify(this.allTimeEntries, null, 2);
                    div.appendChild(entriesInfo);
                    
                    document.body.appendChild(div);
                }
                
                // Manually try to refresh the UI
                this.$forceUpdate();
            },
            
            editTimeEntry(entry) {
                console.log("Editing entry:", entry);
                
                // Create a copy of the entry for editing
                this.editingTimeEntry = {
                    id: entry.id,
                    date: entry.date,
                    start_time: entry.start_time,
                    end_time: entry.end_time
                };
                
                // Open the modal using Bootstrap (with a small delay to ensure DOM is updated)
                this.$nextTick(() => {
                    try {
                        const modalEl = document.getElementById('editEntryModal');
                        if (!modalEl) {
                            console.error("Modal element not found!");
                            return;
                        }
                        const modal = new bootstrap.Modal(modalEl);
                        modal.show();
                    } catch (error) {
                        console.error("Error showing modal:", error);
                    }
                });
            },
            
            // Adjust time in edit mode
            adjustEditTime(type, minutes) {
                if (!this.editingTimeEntry) return;
                
                const timeField = type === 'start' ? 'start_time' : 'end_time';
                const currentTime = this.editingTimeEntry[timeField];
                
                // Parse the time
                const [hours, mins] = currentTime.split(':').map(Number);
                
                // Calculate new time
                let totalMinutes = hours * 60 + mins + minutes;
                if (totalMinutes < 0) totalMinutes = 0;
                if (totalMinutes >= 24 * 60) totalMinutes = 24 * 60 - 1;
                
                const newHours = Math.floor(totalMinutes / 60);
                const newMinutes = totalMinutes % 60;
                
                // Format back to 24-hour format (HH:MM)
                this.editingTimeEntry[timeField] = 
                    `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            },
            
            // Set edit time to now
            setEditTimeToNow(type) {
                if (!this.editingTimeEntry) return;
                
                const timeField = type === 'start' ? 'start_time' : 'end_time';
                const now = new Date();
                
                // Get hours and minutes
                let hours = now.getHours();
                let minutes = now.getMinutes();
                
                // Round to nearest 15 minutes
                minutes = Math.round(minutes / 15) * 15;
                
                // Adjust if minutes rolled over to 60
                if (minutes === 60) {
                    minutes = 0;
                    hours = (hours + 1) % 24;  // Ensure we don't go past 24 hours
                }
                
                // Format back to 24-hour format (HH:MM)
                this.editingTimeEntry[timeField] = 
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            },
            
            async updateTimeEntry() {
                try {
                    if (!this.editingTimeEntry) return;
                    
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const payload = {
                        date: this.editingTimeEntry.date,
                        start_time: this.editingTimeEntry.start_time,
                        end_time: this.editingTimeEntry.end_time
                    };
                    
                    await axios.put(`/time-entries/${this.editingTimeEntry.id}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    // Close the modal
                    const modalEl = document.getElementById('editEntryModal');
                    if (modalEl) {
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                    }
                    
                    // Reload data based on active tab
                    if (this.activeTab === 'allEntries') {
                        await this.loadAllTimeEntries();
                    }
                    
                    // Always reload dashboard data to keep it in sync
                    await this.loadTimeEntries();
                    
                    // Clear editing state
                    this.editingTimeEntry = null;
                    
                } catch (error) {
                    console.error('Error updating time entry:', error);
                    if (error.response?.status === 401) {
                        this.logout();
                    }
                }
            }
        }
    });
    
    // Mount the app to the DOM
    app.mount('#app');
    console.log('Vue app mounted successfully');
});