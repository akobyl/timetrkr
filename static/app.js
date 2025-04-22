// Wait for the DOM to be fully loaded before creating the Vue app
// Utility functions for date calculations
const getDateRanges = {
    // Get the start of the current week (Monday)
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
        
        // Reset the time part to ensure consistent comparison
        startOfWeek.setHours(0, 0, 0, 0);
        
        // Format as YYYY-MM-DD strings
        const startStr = startOfWeek.toISOString().split('T')[0];
        const endStr = today.toISOString().split('T')[0];
        
        return {
            start: startStr,
            end: endStr,
            startDate: startOfWeek,
            endDate: today
        };
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const app = Vue.createApp({
        data() {
            return {
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
                weekSummary: null
            };
        },
        mounted() {
            // Check if user is already authenticated
            const token = localStorage.getItem('token');
            if (token) {
                this.isAuthenticated = true;
                this.loadTimeEntries();
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
                this.todayEntries = [];
                this.weekEntries = [];
                this.todaySummary = null;
                this.weekSummary = null;
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
                    
                    // Get the current week's date range (Monday to today)
                    const weekRange = getDateRanges.getCurrentWeekRange();
                    const startOfWeekStr = weekRange.start;
                    
                    console.log(`Current week range: ${startOfWeekStr} to ${today}`);
                    console.log(`Week start: ${weekRange.startDate.toDateString()}`);
                    console.log(`Today: ${weekRange.endDate.toDateString()}`);
                    
                    // Load all entries (no date filter) then filter client-side
                    const allEntriesResponse = await axios.get('/time-entries/', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    console.log(`Loaded ${allEntriesResponse.data.length} total entries:`, allEntriesResponse.data);
                    
                    // DEBUG: Let's check what entries we have for the whole week
                    for (const entry of allEntriesResponse.data) {
                        console.log(`Entry: date=${entry.date}, start=${entry.start_time}, end=${entry.end_time}`);
                    }
                    
                    // Filter entries from this week and sort by date
                    this.weekEntries = allEntriesResponse.data
                        .filter(entry => {
                            const entryDate = String(entry.date);
                            console.log(`Entry date: ${entryDate}, Week range: ${startOfWeekStr} - ${today}`);
                            
                            // String comparison for ISO formatted dates (YYYY-MM-DD)
                            const isInWeek = entryDate >= startOfWeekStr && entryDate <= today;
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
                    
                    // Get weekly summary using the date range
                    const weekSummaryResponse = await axios.get('/time-summary/', {
                        headers: { Authorization: `Bearer ${token}` },
                        params: { 
                            start_date: startOfWeekStr,
                            end_date: today
                        }
                    });
                    
                    console.log(`Weekly summary request for ${startOfWeekStr} to ${today}`);
                    
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
                    
                    // Force a complete reload of all time entries and summaries
                    await this.loadTimeEntries();
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
            }
        }
    });
    
    // Mount the app to the DOM
    app.mount('#app');
    console.log('Vue app mounted successfully');
});