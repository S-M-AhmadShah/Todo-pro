let addBtn = document.getElementById("addBtn");
let taskInput = document.getElementById("taskInput");
let taskList = document.getElementById("taskList");
let priority = document.getElementById("priority");

let allBtn = document.getElementById("allBtn");
let activeBtn = document.getElementById("activeBtn");
let completedBtn = document.getElementById("completedBtn");
let favoritesBtn = document.getElementById("favoritesBtn");
let taskCount = document.getElementById("taskCount");
let emptyMessage = document.getElementById("emptyMessage");
let clearCompletedBtn = document.getElementById("clearCompleted");
let searchInput = document.getElementById("searchInput");
let toggleMode = document.getElementById("toggleMode");
let dueDateInput = document.getElementById("dueDate");
let categoryInput = document.getElementById("category");
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

renderTasks();

/* CREATE TASK */
function createTask(taskObj, index) {
    let li = document.createElement("li");
    li.dataset.id = taskObj.id;
    li.draggable = true;
    li.classList.add(taskObj.priority);

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = taskObj.completed;

    let span = document.createElement("span");
    span.innerText = taskObj.text;

    let categoryTag = document.createElement("small");
    if (taskObj.category) {
        let categoryNames = {
            personal: "🏠 Personal",
            study: "📚 Study",
            work: "💼 Work",
            important: "⭐ Important"
        };
        categoryTag.innerText = categoryNames[taskObj.category] || taskObj.category;
        categoryTag.classList.add("category-tag");
    }

    let dateText = document.createElement("small");
    if (taskObj.dueDate) {
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let dueDate = new Date(taskObj.dueDate + "T00:00:00");
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

    if (taskObj.completed) li.classList.add("completed");

    checkbox.onchange = () => {
        taskObj.completed = checkbox.checked;
        saveTasks();
        renderTasks(currentFilter);
    };

    // FAVORITE BUTTON
    let favoriteBtn = document.createElement("button");
    favoriteBtn.innerText = taskObj.favorite ? "⭐" : "☆";
    favoriteBtn.classList.add("favorite-btn");

    favoriteBtn.onclick = () => {
        taskObj.favorite = !taskObj.favorite;
        saveTasks();
        renderTasks(currentFilter);
    };

    // DELETE BUTTON
    let del = document.createElement("button");
    del.innerText = "X";

    del.onclick = () => {
        let deletedTask = tasks[index];
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(currentFilter);
        showUndo(deletedTask, index);
    };

    // INLINE EDIT
    span.onclick = () => {
        // 1. ایڈٹ موڈ میں تمام 4 اضافی چیزیں (Category, Due Date, Favorite, Delete) چھپا دیں
        if (categoryTag) categoryTag.style.display = "none";
        if (dateText) dateText.style.display = "none";
        favoriteBtn.style.display = "none";
        del.style.display = "none";

        let input = document.createElement("input");
        input.type = "text";
        input.value = taskObj.text;

        let saveBtn = document.createElement("button");
        saveBtn.innerText = "Save";

        let cancelBtn = document.createElement("button");
        cancelBtn.innerText = "Cancel";

        li.replaceChild(input, span);
        li.append(saveBtn, cancelBtn);
        input.focus();

        // SAVE
        saveBtn.onclick = () => {
            let newText = input.value.trim();
            if (newText === "") return;

            taskObj.text = newText;
            saveTasks();
            renderTasks(currentFilter);
        };

        // CANCEL
        cancelBtn.onclick = () => {
            renderTasks(currentFilter);
        };
    };

    // HTML Structure Build
    li.append(checkbox, span);
    if (taskObj.category) li.append(categoryTag);
    if (taskObj.dueDate) li.append(dateText);
    li.append(favoriteBtn, del);

    // DRAG
    li.ondragstart = () => {
        li.classList.add("dragging");
    };

    li.ondragend = () => {
        li.classList.remove("dragging");
        updateOrder();
    };

    taskList.appendChild(li);
}

/* DRAG ORDER SAVE */
function updateOrder() {
    let items = [...taskList.children];
    let visibleTasks = [];

    items.forEach(item => {
        let id = Number(item.dataset.id);
        let task = tasks.find(t => t.id === id);

        if (task) {
            visibleTasks.push(task);
        }
    });

    let visibleIds = visibleTasks.map(t => t.id);

    let hiddenTasks = tasks.filter(t => !visibleIds.includes(t.id));

    tasks = [...visibleTasks, ...hiddenTasks];

    saveTasks();
}

/* RENDER */
function renderTasks(filter = "all") {
    currentFilter = filter;
        document.querySelectorAll(".filters button").forEach(button => {
        button.classList.remove("active");
    });

    if (filter === "all") allBtn.classList.add("active");
    if (filter === "active") activeBtn.classList.add("active");
    if (filter === "completed") completedBtn.classList.add("active");
    if (filter === "favorites") favoritesBtn.classList.add("active");
    taskList.innerHTML = "";

    let search = searchInput.value.toLowerCase().trim();

    tasks.forEach((t, i) => {
        if (filter === "active" && t.completed) return;
        if (filter === "completed" && !t.completed) return;
        if (filter === "favorites" && !t.favorite) return;
        if (!t.text.toLowerCase().includes(search)) return;

        createTask(t, i);
    });

    // TASK COUNTER
    let totalTasks = tasks.length;
    let completedTasks = tasks.filter(t => t.completed).length;
    let activeTasks = totalTasks - completedTasks;

    taskCount.innerText =
        `${activeTasks} tasks left • ${completedTasks} completed • ${totalTasks} total`;

            // EMPTY STATE
        if (taskList.children.length === 0) 
        {
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
/* ADD */
addBtn.onclick = () => {

    let text = taskInput.value.trim();

    if (text === "") {
        return;
    }

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

/* ENTER KEY */
taskInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {
        addBtn.click();
    }

});

/* FILTERS */
allBtn.onclick = () => renderTasks("all");
activeBtn.onclick = () => renderTasks("active");
completedBtn.onclick = () => renderTasks("completed");
favoritesBtn.onclick = () => renderTasks("favorites");

/* CLEAR COMPLETED */
clearCompletedBtn.onclick = () => {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks(currentFilter);
};

/* SEARCH */
searchInput.oninput = () => renderTasks(currentFilter);

/* DARK MODE */

// Load saved mode
let darkMode = localStorage.getItem("darkMode");

if (darkMode === "enabled") {
    document.body.classList.add("dark");
    toggleMode.innerText = "☀️ Light Mode";
}

// Toggle mode
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

/* SAVE */
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showUndo(deletedTask, index) {

        let undoBox = document.createElement("div");

        undoBox.innerHTML = `
            <span>🗑️ Task deleted</span>
            <button>Undo</button>
        `;

        undoBox.className = "undo-box";

        document.querySelector(".container").appendChild(undoBox);

        let undoButton = undoBox.querySelector("button");

        let undoTimer = setTimeout(() => {
            undoBox.remove();
        }, 5000);

        undoButton.onclick = () => {

            clearTimeout(undoTimer);

            tasks.splice(index, 0, deletedTask);

            saveTasks();
            renderTasks(currentFilter);

            undoBox.remove();
        };
}
