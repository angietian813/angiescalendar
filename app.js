// Schedule Organizer App
// ======================

// State Management
const state = {
    currentDate: new Date(),
    currentView: 'month',
    events: JSON.parse(localStorage.getItem('events')) || [],
    tasks: JSON.parse(localStorage.getItem('tasks')) || [],
    selectedDate: null,
    editingEventId: null,
    editingTaskId: null,
    currentFilter: 'all'
};

// Category Colors
const categoryColors = {
    work: '#4A90D9',
    personal: '#7B68EE',
    school: '#20B2AA'
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    renderCalendar();
    renderTasks();
    setupEventListeners();
});

// Update Current Date Display
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = 
        new Date().toLocaleDateString('en-US', options);
}

// Setup Event Listeners
function setupEventListeners() {
    // View Toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentView = btn.dataset.view;
            renderCalendar();
        });
    });

    // Calendar Navigation
    document.getElementById('prevBtn').addEventListener('click', () => navigateCalendar(-1));
    document.getElementById('nextBtn').addEventListener('click', () => navigateCalendar(1));
    document.getElementById('todayBtn').addEventListener('click', goToToday);

    // Event Modal
    document.getElementById('closeModal').addEventListener('click', closeEventModal);
    document.getElementById('cancelEvent').addEventListener('click', closeEventModal);
    document.getElementById('eventForm').addEventListener('submit', handleEventSubmit);

    // Task Modal
    document.getElementById('addTaskBtn').addEventListener('click', openTaskModal);
    document.getElementById('closeTaskModal').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTask').addEventListener('click', closeTaskModal);
    document.getElementById('taskForm').addEventListener('submit', handleTaskSubmit);

    // Task Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Close modals on overlay click
    document.getElementById('eventModal').addEventListener('click', (e) => {
        if (e.target.id === 'eventModal') closeEventModal();
    });
    document.getElementById('taskModal').addEventListener('click', (e) => {
        if (e.target.id === 'taskModal') closeTaskModal();
    });
}

// Calendar Functions
// ==================

function navigateCalendar(direction) {
    if (state.currentView === 'month') {
        state.currentDate.setMonth(state.currentDate.getMonth() + direction);
    } else {
        state.currentDate.setDate(state.currentDate.getDate() + (direction * 7));
    }
    renderCalendar();
}

function goToToday() {
    state.currentDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    if (state.currentView === 'month') {
        renderMonthView(grid);
    } else {
        renderWeekView(grid);
    }

    updateCalendarTitle();
}

function renderMonthView(grid) {
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);

        const cell = createDayCell(date, today, month);
        grid.appendChild(cell);
    }
}

function renderWeekView(grid) {
    grid.classList.add('week-view');
    
    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const startOfWeek = new Date(state.currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);

        const cell = createDayCell(date, today, null);
        grid.appendChild(cell);
    }
}

function createDayCell(date, today, currentMonth) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    
    if (currentMonth !== null && date.getMonth() !== currentMonth) {
        cell.classList.add('other-month');
    }
    
    if (date.getTime() === today.getTime()) {
        cell.classList.add('today');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    // Add events for this day
    const dateStr = formatDateToString(date);
    const dayEvents = state.events.filter(e => e.date === dateStr);
    
    dayEvents.slice(0, 3).forEach(event => {
        const preview = document.createElement('div');
        preview.className = `event-preview ${event.category}`;
        preview.textContent = `${event.startTime} ${event.title}`;
        cell.appendChild(preview);
    });

    if (dayEvents.length > 3) {
        const more = document.createElement('div');
        more.style.fontSize = '11px';
        more.style.color = '#8FA3B4';
        more.textContent = `+${dayEvents.length - 3} more`;
        cell.appendChild(more);
    }

    // Click to add/view events
    cell.addEventListener('click', () => openEventModal(date, dayEvents));

    return cell;
}

function updateCalendarTitle() {
    const title = document.getElementById('calendarTitle');
    const options = { month: 'long', year: 'numeric' };
    
    if (state.currentView === 'month') {
        title.textContent = state.currentDate.toLocaleDateString('en-US', options);
    } else {
        const startOfWeek = new Date(state.currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
        const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
        title.textContent = `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    }
}

// Event Modal Functions
// =====================

function openEventModal(date, existingEvents = []) {
    state.selectedDate = date;
    state.editingEventId = null;
    
    document.getElementById('modalTitle').textContent = 'Add Event';
    document.getElementById('eventForm').reset();
    
    // Show existing events for the day
    if (existingEvents.length > 0) {
        const eventsList = document.createElement('div');
        eventsList.className = 'existing-events';
        eventsList.style.marginBottom = '16px';
        eventsList.style.paddingBottom = '16px';
        eventsList.style.borderBottom = '1px solid #D4E5F7';
        
        existingEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.style.display = 'flex';
            eventItem.style.justifyContent = 'space-between';
            eventItem.style.alignItems = 'center';
            eventItem.style.padding = '8px';
            eventItem.style.marginBottom = '8px';
            eventItem.style.background = '#F5FAFF';
            eventItem.style.borderRadius = '8px';
            
            eventItem.innerHTML = `
                <div>
                    <span style="font-weight: 500;">${event.title}</span>
                    <span style="color: #8FA3B4; margin-left: 8px; font-size: 13px;">${event.startTime} - ${event.endTime}</span>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="edit-event" data-id="${event.id}" style="background: none; border: none; color: #4A90D9; cursor: pointer; font-size: 13px;">Edit</button>
                    <button class="delete-event" data-id="${event.id}" style="background: none; border: none; color: #E74C3C; cursor: pointer; font-size: 13px;">Delete</button>
                </div>
            `;
            
            eventsList.appendChild(eventItem);
        });
        
        const form = document.getElementById('eventForm');
        const existingContainer = document.querySelector('.existing-events');
        if (existingContainer) existingContainer.remove();
        form.parentElement.insertBefore(eventsList, form);
        
        // Add event listeners for edit/delete
        eventsList.querySelectorAll('.edit-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                editEvent(btn.dataset.id);
            });
        });
        
        eventsList.querySelectorAll('.delete-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteEvent(btn.dataset.id);
            });
        });
    } else {
        const existingContainer = document.querySelector('.existing-events');
        if (existingContainer) existingContainer.remove();
    }
    
    document.getElementById('eventModal').classList.add('active');
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
    state.selectedDate = null;
    state.editingEventId = null;
}

function editEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;
    
    state.editingEventId = eventId;
    document.getElementById('modalTitle').textContent = 'Edit Event';
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventStart').value = event.startTime;
    document.getElementById('eventEnd').value = event.endTime;
    document.getElementById('eventCategory').value = event.category;
}

function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        state.events = state.events.filter(e => e.id !== eventId);
        saveEvents();
        renderCalendar();
        
        // Refresh modal
        if (state.selectedDate) {
            const dateStr = formatDateToString(state.selectedDate);
            const dayEvents = state.events.filter(e => e.date === dateStr);
            openEventModal(state.selectedDate, dayEvents);
        }
    }
}

function handleEventSubmit(e) {
    e.preventDefault();
    
    const eventData = {
        id: state.editingEventId || generateId(),
        title: document.getElementById('eventTitle').value,
        startTime: document.getElementById('eventStart').value,
        endTime: document.getElementById('eventEnd').value,
        category: document.getElementById('eventCategory').value,
        date: formatDateToString(state.selectedDate)
    };

    if (state.editingEventId) {
        const index = state.events.findIndex(e => e.id === state.editingEventId);
        if (index !== -1) {
            state.events[index] = eventData;
        }
    } else {
        state.events.push(eventData);
    }

    saveEvents();
    renderCalendar();
    closeEventModal();
}

function saveEvents() {
    localStorage.setItem('events', JSON.stringify(state.events));
}

// Task Functions
// ==============

function openTaskModal() {
    state.editingTaskId = null;
    document.getElementById('taskModalTitle').textContent = 'Add Task';
    document.getElementById('taskForm').reset();
    document.getElementById('taskDueDate').valueAsDate = new Date();
    document.getElementById('taskModal').classList.add('active');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.remove('active');
    state.editingTaskId = null;
}

function handleTaskSubmit(e) {
    e.preventDefault();
    
    const taskData = {
        id: state.editingTaskId || generateId(),
        name: document.getElementById('taskName').value,
        dueDate: document.getElementById('taskDueDate').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        completed: state.editingTaskId ? 
            state.tasks.find(t => t.id === state.editingTaskId)?.completed || false : false,
        createdAt: state.editingTaskId ? 
            state.tasks.find(t => t.id === state.editingTaskId)?.createdAt : Date.now()
    };

    if (state.editingTaskId) {
        const index = state.tasks.findIndex(t => t.id === state.editingTaskId);
        if (index !== -1) {
            state.tasks[index] = taskData;
        }
    } else {
        state.tasks.push(taskData);
    }

    saveTasks();
    renderTasks();
    closeTaskModal();
}

function toggleTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
    }
}

function editTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    state.editingTaskId = taskId;
    document.getElementById('taskModalTitle').textContent = 'Edit Task';
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskDueDate').value = task.dueDate;
    document.getElementById('taskPriority').value = task.priority;
    document.getElementById('taskCategory').value = task.category;
    document.getElementById('taskModal').classList.add('active');
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(state.tasks));
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    let filteredTasks = [...state.tasks];
    
    // Apply filters
    const today = formatDateToString(new Date());
    
    switch (state.currentFilter) {
        case 'today':
            filteredTasks = filteredTasks.filter(t => t.dueDate === today);
            break;
        case 'high':
            filteredTasks = filteredTasks.filter(t => t.priority === 'high');
            break;
        case 'completed':
            filteredTasks = filteredTasks.filter(t => t.completed);
            break;
    }
    
    // Sort by due date and priority
    filteredTasks.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                </svg>
                <p>No tasks found</p>
            </div>
        `;
    } else {
        taskList.innerHTML = filteredTasks.map(task => createTaskHTML(task)).join('');
        
        // Add event listeners
        taskList.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', () => toggleTask(checkbox.dataset.id));
        });
        
        taskList.querySelectorAll('.task-edit').forEach(btn => {
            btn.addEventListener('click', () => editTask(btn.dataset.id));
        });
        
        taskList.querySelectorAll('.task-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteTask(btn.dataset.id));
        });
    }
    
    updateProgress();
}

function createTaskHTML(task) {
    const dueDate = new Date(task.dueDate + 'T00:00:00');
    const formattedDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task.id}"></div>
            <div class="task-content">
                <div class="task-name">${task.name}</div>
                <div class="task-meta">
                    <span>📅 ${formattedDate}</span>
                    <span class="priority-badge ${task.priority}">${task.priority}</span>
                    <span class="category-tag ${task.category}">${task.category}</span>
                </div>
            </div>
            <button class="task-edit" data-id="${task.id}" style="background: none; border: none; color: #4A90D9; cursor: pointer; font-size: 13px; padding: 4px 8px;">Edit</button>
            <button class="task-delete" data-id="${task.id}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
            </button>
        </div>
    `;
}

function updateProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    document.getElementById('progressText').textContent = `${completed} of ${total} tasks completed`;
    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
}

// Utility Functions
// =================

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDateToString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Keyboard Navigation
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEventModal();
        closeTaskModal();
    }
});
