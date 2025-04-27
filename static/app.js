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
        tokenExpiryTime: null, // Track when token expires
        loginForm: {
          username: '',
          password: ''
        },
        registerForm: {
          username: '',
          password: ''
        },

        // No tab state needed as there's only one view now

        // Dashboard tab
        currentEntry: {
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',  // 9:00 AM in 24-hour format
          endTime: '17:00'     // 5:00 PM in 24-hour format
        },
        todayEntries: [],
        weekEntries: [],
        dailyTotals: {}, // Store daily totals: { "2025-04-25": { minutes: 480, count: 2 } }
        expandedDays: [], // Track which days are expanded to show entries
        filterDate: new Date().toISOString().split('T')[0],
        editingEntry: null,
        todaySummary: null,
        weekSummary: null,

        // Edit mode state (moved from All Entries tab)
        editingTimeEntry: null
      };
    },
    mounted() {
      // Check if user is already authenticated
      const token = localStorage.getItem('token');
      if (token) {
        // Set expiry time to 6 days from now (shorter than the actual 7-day token)
        // This gives us a buffer to avoid expiry during use
        const sixDaysFromNow = new Date();
        sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
        this.tokenExpiryTime = sixDaysFromNow.getTime();
        localStorage.setItem('tokenExpiry', this.tokenExpiryTime);

        this.isAuthenticated = true;
        // Load both dashboard and all entries data on startup
        this.loadTimeEntries();
        this.loadAllTimeEntries();
      } else {
        // Check if there's a saved expiry time
        const savedExpiry = localStorage.getItem('tokenExpiry');
        if (savedExpiry) {
          const expiryTime = parseInt(savedExpiry);
          const now = new Date().getTime();

          // If token is not too old (within 7 days), try auto-login from stored credentials
          if (now < expiryTime) {
            console.log("Token missing but within expiry window, trying to restore session");
            this.tryRestoreSession();
          }
        }
      }

      // Set up auto-refresh for the dashboard (every 30 seconds)
      setInterval(() => {
        if (this.isAuthenticated) {
          this.loadTimeEntries();
        }
      }, 30000); // 30 seconds
    },

    // No computed properties needed after removing All Entries tab
    methods: {
      // Try to restore a session from saved credentials
      async tryRestoreSession() {
        const savedUsername = localStorage.getItem('username');
        const savedPassword = localStorage.getItem('password');

        if (savedUsername && savedPassword) {
          try {
            console.log("Attempting to restore session with saved credentials");
            const formData = new FormData();
            formData.append('username', savedUsername);
            formData.append('password', savedPassword);

            const response = await axios.post('/token', formData);
            localStorage.setItem('token', response.data.access_token);

            // Set expiry time to 6 days from now
            const sixDaysFromNow = new Date();
            sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
            this.tokenExpiryTime = sixDaysFromNow.getTime();
            localStorage.setItem('tokenExpiry', this.tokenExpiryTime);

            this.isAuthenticated = true;
            // Load dashboard data on restoration
            this.loadTimeEntries();
            console.log("Session restored successfully");
          } catch (error) {
            console.error("Failed to restore session:", error);
            // Clear saved credentials if they don't work
            localStorage.removeItem('username');
            localStorage.removeItem('password');
            localStorage.removeItem('tokenExpiry');
          }
        }
      },

      async login() {
        try {
          this.authError = null;
          const formData = new FormData();
          formData.append('username', this.loginForm.username);
          formData.append('password', this.loginForm.password);

          const response = await axios.post('/token', formData);
          localStorage.setItem('token', response.data.access_token);

          // Optionally save credentials for session restoration
          // Note: This stores password in localStorage which has security implications
          // In a production app, consider a more secure approach
          localStorage.setItem('username', this.loginForm.username);
          localStorage.setItem('password', this.loginForm.password);

          // Set expiry time to 6 days from now
          const sixDaysFromNow = new Date();
          sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);
          this.tokenExpiryTime = sixDaysFromNow.getTime();
          localStorage.setItem('tokenExpiry', this.tokenExpiryTime);

          this.isAuthenticated = true;
          // Load dashboard data on login
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
        // Clear all auth-related data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        localStorage.removeItem('username');
        localStorage.removeItem('password');

        this.isAuthenticated = false;
        this.tokenExpiryTime = null;

        // Clear all app data
        this.todayEntries = [];
        this.weekEntries = [];
        this.todaySummary = null;
        this.weekSummary = null;

        console.log("User logged out successfully");
      },

      async loadTimeEntries() {
        try {
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

          // Get today's summary
          const todaySummaryResponse = await axios.get('/time-summary/', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              start_date: today,
              end_date: today
            }
          });

          this.todaySummary = todaySummaryResponse.data;

          // Get the current week's date range (Monday to Sunday)
          const weekRange = getDateRanges.getCurrentWeekRange();
          const startOfWeekStr = weekRange.start;
          const endOfWeekStr = weekRange.end;

          // Load all entries (no date filter) then filter client-side
          const allEntriesResponse = await axios.get('/time-entries/', {
            headers: { Authorization: `Bearer ${token}` }
          });

          // Filter entries from the full week and sort by date
          const weekFilteredEntries = allEntriesResponse.data
            .filter(entry => {
              const entryDate = String(entry.date);

              // String comparison for ISO formatted dates (YYYY-MM-DD)
              const isInWeek = entryDate >= startOfWeekStr && entryDate <= endOfWeekStr;
              return isInWeek;
            })
            .sort((a, b) => {
              // Sort by date ascending and then by start time
              if (a.date !== b.date) {
                return a.date < b.date ? -1 : 1;
              }
              return a.start_time < b.start_time ? -1 : 1;
            });
            
          // Set the week entries
          this.weekEntries = weekFilteredEntries;
          
          // Reset expanded days when loading new data
          this.expandedDays = [];
          
          // Calculate daily totals for the week
          this.dailyTotals = {};
          weekFilteredEntries.forEach(entry => {
            const dateStr = entry.date;
            if (!this.dailyTotals[dateStr]) {
              this.dailyTotals[dateStr] = { minutes: 0, count: 0 };
            }
            
            // Calculate duration
            const [startHours, startMins] = entry.start_time.split(':').map(Number);
            const [endHours, endMins] = entry.end_time.split(':').map(Number);
            
            let durationMinutes = (endHours * 60 + endMins) - (startHours * 60 + startMins);
            if (durationMinutes < 0) durationMinutes += 24 * 60; // Handle overnight
            
            // Add to the daily total
            this.dailyTotals[dateStr].minutes += durationMinutes;
            this.dailyTotals[dateStr].count += 1;
          });

          // Get weekly summary for the full week
          const weekSummaryResponse = await axios.get('/time-summary/', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              start_date: startOfWeekStr,
              end_date: endOfWeekStr
            }
          });

          this.weekSummary = weekSummaryResponse.data;

        } catch (error) {
          console.error('Error loading time entries:', error);

          // Only log out on unauthorized errors if it's a token validation issue
          if (error.response?.status === 401) {
            // Check if it's a token validation issue vs just a missing token
            const errorMsg = error.response?.data?.detail || '';
            if (errorMsg.includes('credentials') || errorMsg.includes('token')) {
              console.warn('Authentication error, logging out:', errorMsg);
              this.logout();
            } else {
              console.warn('Non-critical 401 error, not logging out:', errorMsg);
            }
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

          // Force a complete reload of time entries and summaries
          await this.loadTimeEntries();
        } catch (error) {
          console.error('Error saving time entry:', error);

          // Only log out for critical auth errors
          if (error.response?.status === 401) {
            const errorMsg = error.response?.data?.detail || '';
            if (errorMsg.includes('credentials') || errorMsg.includes('token')) {
              console.warn('Authentication error, logging out:', errorMsg);
              this.logout();
            } else {
              console.warn('Non-critical 401 error, not logging out:', errorMsg);
            }
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

          // Reload dashboard data
          await this.loadTimeEntries();
        } catch (error) {
          console.error('Error deleting time entry:', error);

          // Only log out for critical auth errors
          if (error.response?.status === 401) {
            const errorMsg = error.response?.data?.detail || '';
            if (errorMsg.includes('credentials') || errorMsg.includes('token')) {
              console.warn('Authentication error, logging out:', errorMsg);
              this.logout();
            } else {
              console.warn('Non-critical 401 error, not logging out:', errorMsg);
            }
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
      
      // Toggle display of entries for a specific day
      toggleDayEntries(dateStr) {
        const index = this.expandedDays.indexOf(dateStr);
        if (index === -1) {
          // Add to expanded list
          this.expandedDays.push(dateStr);
        } else {
          // Remove from expanded list
          this.expandedDays.splice(index, 1);
        }
      },
      
      // Get entries for a specific day
      getDayEntries(dateStr) {
        return this.weekEntries.filter(entry => entry.date === dateStr);
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

        // Round to nearest 5 minutes
        minutes = Math.round(minutes / 5) * 5;

        // Adjust if minutes rolled over to 60
        if (minutes === 60) {
          minutes = 0;
          hours = (hours + 1) % 24;  // Ensure we don't go past 24 hours
        }

        // Format back to 24-hour format (HH:MM)
        this.currentEntry[timeField] =
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      },

      formatDate(dateStr) {
        // Fix timezone issue by explicitly parsing the date and adjusting for timezone
        // The input dateStr is in format YYYY-MM-DD
        // Create a new date with the UTC time set to midnight of that day
        const parts = dateStr.split('-');
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // JS months are 0-based
        const day = parseInt(parts[2]);

        // Create date in local timezone (not UTC)
        const date = new Date(year, month, day);
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

      // Keep only the edit modal functionality methods


      editTimeEntry(entry) {
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

          // Reload dashboard data
          await this.loadTimeEntries();

          // Clear editing state
          this.editingTimeEntry = null;

        } catch (error) {
          console.error('Error updating time entry:', error);

          // Only log out for critical auth errors
          if (error.response?.status === 401) {
            const errorMsg = error.response?.data?.detail || '';
            if (errorMsg.includes('credentials') || errorMsg.includes('token')) {
              console.warn('Authentication error, logging out:', errorMsg);
              this.logout();
            } else {
              console.warn('Non-critical 401 error, not logging out:', errorMsg);
            }
          }
        }
      }
    }
  });

  // Mount the app to the DOM
  app.mount('#app');
  console.log('Vue app mounted successfully');
});
