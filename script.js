/* ========================================================================== */
/* 1. INITIALIZATION & STATE MANAGEMENT */
/* ========================================================================== */

const addBtn = document.getElementById("addBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const priority = document.getElementById("priority");

const allBtn = document.getElementById("allBtn");
const activeBtn = document.getElementById("activeBtn");
const completedBtn = document.getElementById("completedBtn");
const favoritesBtn = document.getElementById("favoritesBtn");

const taskCount = document.getElementById("taskCount");
const emptyMessage = document.getElementById("emptyMessage");
const clearCompletedBtn = document.getElementById("clearCompleted");
const searchInput = document.getElementById("searchInput");
const toggleMode = document.getElementById("toggleMode");
const dueDateInput = document.getElementById("dueDate");
const categoryInput = document.getElementById("category");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// Initial Application Render
renderTasks(currentFilter);


/* ========================================================================== */
/* 2. TASK COMPONENT CREATION */
/* ========================================================================== */

function createTask(taskObj) {
    const li = document.createElement("li");
    li.dataset.id = taskObj.id;
    li.draggable = true;
    li.classList.add(taskObj.priority);

    // Checkbox State
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = taskObj.completed;

    // Task Text
    const span = document.createElement("span");
    span.innerText = taskObj.text;

    // Category Tag
    let categoryTag = null;
    if (taskObj.category) {
        categoryTag = document.createElement("small");
        const categoryNames = {
            personal: "🏠 Personal",
            study: "📚 Study",
            work: "💼 Work",
            important: "⭐ Important"
        };
        categoryTag.innerText = categoryNames[taskObj.category] || taskObj.category;
        categoryTag.classList.add("category-tag");
    }

    // Due Date Tag
    let dateText = null;
    if (taskObj.dueDate) {
        dateText = document.createElement("small");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(taskObj.dueDate + "T00:00:00");
        dueDate.setHours(0, 0, 0, 0);

        dateText.classList.add("due-date");

        if (!taskObj.completed && dueDate < today) {
            dateText.innerText = "🔴 Overdue: " + taskObj.dueDate;
            dateText.classList.add("overdue");
        } else if (!taskObj.completed && dueDate.getTime() === today.getTime()) {
            dateText.innerText = "🟢 Today";
            dateText.classList.add("today");
        } else {
            dateText.innerText = "📅 " + taskObj.dueDate;
            dateText.classList.add("upcoming");
        }
    }

    if (taskObj.completed) {
        li.classList.add("completed");
    }

    // Toggle Task Status
    checkbox.onchange = () => {
        taskObj.completed = checkbox.checked;
        saveTasks();
        renderTasks(currentFilter);
    };

    // Favorite Button
    const favoriteBtn = document.createElement("button");
    favoriteBtn.innerText = taskObj.favorite ? "⭐" : "☆";
    favoriteBtn.classList.add("favorite-btn");

    favoriteBtn.onclick = () => {
        taskObj.favorite = !taskObj.favorite;
        saveTasks();
        renderTasks(currentFilter);
    };

    // Delete Button
    const del = document.createElement("button");
    del.innerText = "X";

    del.onclick = () => {
        const actualIndex = tasks.findIndex(t => t.id === taskObj.id);
        if (actualIndex > -1) {
            const deletedTask = tasks[actualIndex];
            tasks.splice(actualIndex, 1);
            saveTasks();
            renderTasks(currentFilter);
            showUndo(deletedTask, actualIndex);
        }
    };

    // Inline Editing
    span.onclick = () => {
        if (categoryTag) categoryTag.style.display = "none";
        if (dateText) dateText.style.display = "none";
        favoriteBtn.style.display = "none";
        del.style.display = "none";
        checkbox.style.display = "none";

        const input = document.createElement("input");
        input.type = "text";
        input.value = taskObj.text;

        const saveBtn = document.createElement("button");
        saveBtn.innerText = "Save";

        const cancelBtn = document.createElement("button");
        cancelBtn.innerText = "Cancel";

        li.replaceChild(input, span);
        li.append(saveBtn, cancelBtn);
        input.focus();

        const handleSave = () => {
            const newText = input.value.trim();
            if (newText !== "") {
                taskObj.text = newText;
                saveTasks();
            }
            renderTasks(currentFilter);
        };

        saveBtn.onclick = handleSave;

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") renderTasks(currentFilter);
        });

        cancelBtn.onclick = () => renderTasks(currentFilter);
    };

    // Construct DOM Hierarchy
    li.append(checkbox, span);
    if (categoryTag) li.append(categoryTag);
    if (dateText) li.append(dateText);
    li.append(favoriteBtn, del);

    // Drag-and-Drop Handlers
    li.ondragstart = () => li.classList.add("dragging");
    li.ondragend = () => {
        li.classList.remove("dragging");
        updateOrder();
    };

    taskList.appendChild(li);
}


/* ========================================================================== */
/* 3. REORDERING & PERSISTENCE */
/* ========================================================================== */

function updateOrder() {
    const items = [...taskList.children];
    const visibleTasks = [];

    items.forEach(item => {
        const id = Number(item.dataset.id);
        const task = tasks.find(t => t.id === id);
        if (task) visibleTasks.push(task);
    });

    const visibleIds = visibleTasks.map(t => t.id);
    const hiddenTasks = tasks.filter(t => !visibleIds.includes(t.id));

    tasks = [...visibleTasks, ...hiddenTasks];
    saveTasks();
}

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}


/* ========================================================================== */
/* 4. MAIN RENDER FUNCTION */
/* ========================================================================== */

function renderTasks(filter = "all") {
    currentFilter = filter;

    // Update Filter Tab Highlights
    document.querySelectorAll(".filters button").forEach(btn => btn.classList.remove("active"));
    if (filter === "all") allBtn.classList.add("active");
    if (filter === "active") activeBtn.classList.add("active");
    if (filter === "completed") completedBtn.classList.add("active");
    if (filter === "favorites") favoritesBtn.classList.add("active");

    taskList.innerHTML = "";
    const search = searchInput.value.toLowerCase().trim();

    tasks.forEach(task => {
        if (filter === "active" && task.completed) return;
        if (filter === "completed" && !task.completed) return;
        if (filter === "favorites" && !task.favorite) return;
        if (!task.text.toLowerCase().includes(search)) return;

        createTask(task);
    });

    // Update Counters
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeTasks = totalTasks - completedTasks;

    taskCount.innerText = `${activeTasks} tasks left • ${completedTasks} completed • ${totalTasks} total`;

    // Handle Empty State Messaging
    if (taskList.children.length === 0) {
        emptyMessage.style.display = "block";
        if (search !== "") {
            emptyMessage.innerText = "🔍 No matching tasks found";
        } else if (filter === "active") {
            emptyMessage.innerText = "🎉 No active tasks!";
        } else if (filter === "completed") {
            emptyMessage.innerText = "📝 No completed tasks yet";
        } else if (filter === "favorites") {
            emptyMessage.innerText = "⭐ No favorite tasks yet";
        } else {
            emptyMessage.innerText = "📝 No tasks found. Add a new task to get started!";
        }
    } else {
        emptyMessage.style.display = "none";
    }
}


/* ========================================================================== */
/* 5. EVENT LISTENERS & USER ACTIONS */
/* ========================================================================== */

// Add New Task
addBtn.onclick = () => {
    const text = taskInput.value.trim();
    if (text === "") return;

    tasks.push({
        id: Date.now(),
        text: text,
        completed: false,
        priority: priority.value,
        favorite: false,
        dueDate: dueDateInput.value,
        category: categoryInput.value
    });

    saveTasks();
    renderTasks(currentFilter);

    taskInput.value = "";
    dueDateInput.value = "";
};

// Enter Key Press Shortcut
taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addBtn.click();
    }
});

// Filter Navigation
allBtn.onclick = () => renderTasks("all");
activeBtn.onclick = () => renderTasks("active");
completedBtn.onclick = () => renderTasks("completed");
favoritesBtn.onclick = () => renderTasks("favorites");

// Clear Completed Tasks
clearCompletedBtn.onclick = () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks(currentFilter);
};

// Real-time Search
searchInput.oninput = () => renderTasks(currentFilter);


/* ========================================================================== */
/* 6. DARK MODE TOGGLE */
/* ========================================================================== */

const darkMode = localStorage.getItem("darkMode");

if (darkMode === "enabled") {
    document.body.classList.add("dark");
    toggleMode.innerText = "☀️ Light Mode";
}

toggleMode.onclick = () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("darkMode", "enabled");
        toggleMode.innerText = "☀️ Light Mode";
    } else {
        localStorage.setItem("darkMode", "disabled");
        toggleMode.innerText = "🌙 Dark Mode";
    }
};


/* ========================================================================== */
/* 7. UNDO NOTIFICATION SYSTEM */
/* ========================================================================== */

function showUndo(deletedTask, originalIndex) {
    // Existing undo boxes ko remove karen taake cluttering na ho
    const existingUndo = document.querySelector(".undo-box");
    if (existingUndo) existingUndo.remove();

    const undoBox = document.createElement("div");
    undoBox.className = "undo-box";
    undoBox.innerHTML = `
        <span>🗑️ Task deleted</span>
        <button>Undo</button>
    `;

    document.querySelector(".container").appendChild(undoBox);

    const undoButton = undoBox.querySelector("button");

    const undoTimer = setTimeout(() => {
        undoBox.remove();
    }, 5000);

    undoButton.onclick = () => {
        clearTimeout(undoTimer);
        
        // Target index check karke insert karen
        const insertIndex = originalIndex > tasks.length ? tasks.length : originalIndex;
        tasks.splice(insertIndex, 0, deletedTask);

        saveTasks();
        renderTasks(currentFilter);
        undoBox.remove();
    };
}
