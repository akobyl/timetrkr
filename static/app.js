// Wait for the DOM to be fully loaded before creating the Vue app
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
                    startTime: '09:00',
                    endTime: '17:00'
                },
                timeEntries: [],
                filterDate: new Date().toISOString().split('T')[0],
                editingEntry: null
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
                this.timeEntries = [];
            },
            
            async loadTimeEntries() {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) return;
                    
                    const params = {};
                    if (this.filterDate) {
                        params.entry_date = this.filterDate;
                    }
                    
                    const response = await axios.get('/time-entries/', {
                        headers: { Authorization: `Bearer ${token}` },
                        params
                    });
                    
                    this.timeEntries = response.data;
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
                    this.loadTimeEntries();
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
                    
                    this.loadTimeEntries();
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
                    startTime: '09:00',
                    endTime: '17:00'
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
                
                // Format back to HH:MM
                this.currentEntry[timeField] = 
                    `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            },
            
            formatDate(dateStr) {
                const date = new Date(dateStr);
                return date.toLocaleDateString();
            },
            
            formatTime(timeStr) {
                return timeStr;
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