```javascript
/* ============================= */
/* ELEMENTS */
/* ============================= */

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


/* ============================= */
/* SAFE LOCAL STORAGE */
/* ============================= */

function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("tasks");

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks
            .filter(task => task && typeof task === "object")
            .map(task => ({
                id: Number(task.id) || Date.now() + Math.random(),
                text: typeof task.text === "string" ? task.text : "",
                completed: Boolean(task.completed),
                priority:
                    task.priority === "low" ||
                    task.priority === "medium" ||
                    task.priority === "high"
                        ? task.priority
                        : "",
                favorite: Boolean(task.favorite),
                dueDate: typeof task.dueDate === "string"
                    ? task.dueDate
                    : "",
                category: typeof task.category === "string"
                    ? task.category
                    : "personal"
            }))
            .filter(task => task.text.trim() !== "");

    } catch (error) {
        console.error("Could not load tasks:", error);
        return [];
    }
}


let tasks = loadTasks();
let currentFilter = "all";
let draggedTaskId = null;


/* ============================= */
/* SAVE TASKS */
/* ============================= */

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    } catch (error) {
        console.error("Could not save tasks:", error);
    }
}


/* ============================= */
/* CREATE TASK */
/* ============================= */

function createTask(taskObj) {

    const li = document.createElement("li");

    li.dataset.id = String(taskObj.id);

    /*
     * IMPORTANT:
     * Empty className ko add nahi karna.
     * Is se mobile/desktop par classList error avoid hota hai.
     */
    if (taskObj.priority) {
        li.classList.add(taskObj.priority);
    }

    li.draggable = true;


    /* ============================= */
    /* CHECKBOX */
    /* ============================= */

    const checkbox = document.createElement("input");

    checkbox.type = "checkbox";
    checkbox.checked = taskObj.completed;
    checkbox.setAttribute("aria-label", "Complete task");


    /* ============================= */
    /* TASK TEXT */
    /* ============================= */

    const span = document.createElement("span");

    span.textContent = taskObj.text;

    span.title = "Click to edit";


    /* ============================= */
    /* CATEGORY */
    /* ============================= */

    const categoryTag = document.createElement("small");

    const categoryNames = {
        personal: "🏠 Personal",
        study: "📚 Study",
        work: "💼 Work",
        important: "⭐ Important"
    };

    if (taskObj.category) {
        categoryTag.textContent =
            categoryNames[taskObj.category] || taskObj.category;

        categoryTag.classList.add("category-tag");
    }


    /* ============================= */
    /* DUE DATE */
/* ============================= */

    const dateText = document.createElement("small");

    if (taskObj.dueDate) {

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const dueDate = new Date(taskObj.dueDate + "T00:00:00");

        dueDate.setHours(0, 0, 0, 0);

        dateText.classList.add("due-date");

        if (!taskObj.completed && dueDate < today) {

            dateText.textContent =
                "🔴 Overdue: " + taskObj.dueDate;

            dateText.classList.add("overdue");

        } else if (
            !taskObj.completed &&
            dueDate.getTime() === today.getTime()
        ) {

            dateText.textContent = "🟢 Today";

            dateText.classList.add("today");

        } else {

            dateText.textContent =
                "📅 " + taskObj.dueDate;

            dateText.classList.add("upcoming");
        }
    }


    /* ============================= */
    /* COMPLETED */
/* ============================= */

    if (taskObj.completed) {
        li.classList.add("completed");
    }


    /* ============================= */
    /* CHECKBOX CHANGE */
/* ============================= */

    checkbox.addEventListener("change", () => {

        taskObj.completed = checkbox.checked;

        saveTasks();

        renderTasks(currentFilter);
    });


    /* ============================= */
    /* FAVORITE BUTTON */
/* ============================= */

    const favoriteBtn = document.createElement("button");

    favoriteBtn.type = "button";

    favoriteBtn.classList.add("favorite-btn");

    favoriteBtn.textContent =
        taskObj.favorite ? "⭐" : "☆";

    favoriteBtn.setAttribute(
        "aria-label",
        taskObj.favorite
            ? "Remove from favorites"
            : "Add to favorites"
    );


    favoriteBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        taskObj.favorite = !taskObj.favorite;

        saveTasks();

        renderTasks(currentFilter);
    });


    /* ============================= */
    /* DELETE BUTTON */
/* ============================= */

    const deleteBtn = document.createElement("button");

    deleteBtn.type = "button";

    deleteBtn.textContent = "X";

    deleteBtn.classList.add("delete-btn");

    deleteBtn.setAttribute("aria-label", "Delete task");


    deleteBtn.addEventListener("click", (event) => {

        event.stopPropagation();

        const taskIndex = tasks.findIndex(
            task => task.id === taskObj.id
        );

        if (taskIndex === -1) {
            return;
        }

        const deletedTask = tasks[taskIndex];

        tasks.splice(taskIndex, 1);

        saveTasks();

        renderTasks(currentFilter);

        showUndo(deletedTask, taskIndex);
    });


    /* ============================= */
    /* INLINE EDIT */
/* ============================= */

    span.addEventListener("click", () => {

        if (li.querySelector(".edit-input")) {
            return;
        }

        categoryTag.style.display = "none";
        dateText.style.display = "none";
        favoriteBtn.style.display = "none";
        deleteBtn.style.display = "none";
        checkbox.style.display = "none";

        span.style.display = "none";


        const input = document.createElement("input");

        input.type = "text";
        input.value = taskObj.text;
        input.classList.add("edit-input");

        input.setAttribute("aria-label", "Edit task");


        const saveBtn = document.createElement("button");

        saveBtn.type = "button";
        saveBtn.textContent = "Save";


        const cancelBtn = document.createElement("button");

        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";


        li.append(input, saveBtn, cancelBtn);

        input.focus();

        input.select();


        /* SAVE EDIT */

        const saveEdit = () => {

            const newText = input.value.trim();

            if (!newText) {
                input.focus();
                return;
            }

            taskObj.text = newText;

            saveTasks();

            renderTasks(currentFilter);
        };


        saveBtn.addEventListener("click", saveEdit);


        /* ENTER = SAVE */

        input.addEventListener("keydown", (event) => {

            if (event.key === "Enter") {
                event.preventDefault();
                saveEdit();
            }

            if (event.key === "Escape") {
                event.preventDefault();
                renderTasks(currentFilter);
            }
        });


        /* CANCEL */

        cancelBtn.addEventListener("click", () => {
            renderTasks(currentFilter);
        });
    });


    /* ============================= */
    /* BUILD TASK */
/* ============================= */

    li.append(
        checkbox,
        span
    );

    if (taskObj.category) {
        li.append(categoryTag);
    }

    if (taskObj.dueDate) {
        li.append(dateText);
    }

    li.append(
        favoriteBtn,
        deleteBtn
    );


    /* ============================= */
    /* DRAG & DROP */
/* ============================= */

    li.addEventListener("dragstart", (event) => {

        draggedTaskId = taskObj.id;

        li.classList.add("dragging");

        event.dataTransfer.effectAllowed = "move";

        event.dataTransfer.setData(
            "text/plain",
            String(taskObj.id)
        );
    });


    li.addEventListener("dragend", () => {

        draggedTaskId = null;

        li.classList.remove("dragging");
    });


    li.addEventListener("dragover", (event) => {

        event.preventDefault();

        const dragging = taskList.querySelector(".dragging");

        if (!dragging || dragging === li) {
            return;
        }

        const rect = li.getBoundingClientRect();

        const middle = rect.top + rect.height / 2;

        if (event.clientY < middle) {
            taskList.insertBefore(dragging, li);
        } else {
            taskList.insertBefore(dragging, li.nextSibling);
        }
    });


    li.addEventListener("drop", (event) => {

        event.preventDefault();

        updateOrderFromDOM();
    });


    taskList.appendChild(li);
}


/* ============================= */
/* UPDATE ORDER */
/* ============================= */

function updateOrderFromDOM() {

    const visibleIds = [...taskList.children]
        .map(item => Number(item.dataset.id));

    if (!visibleIds.length) {
        return;
    }

    const visibleSet = new Set(visibleIds);

    const visibleTasks = visibleIds
        .map(id => tasks.find(task => task.id === id))
        .filter(Boolean);

    const hiddenTasks = tasks.filter(
        task => !visibleSet.has(task.id)
    );

    tasks = [
        ...visibleTasks,
        ...hiddenTasks
    ];

    saveTasks();

    renderTasks(currentFilter);
}


/* ============================= */
/* RENDER */
/* ============================= */

function renderTasks(filter = currentFilter) {

    currentFilter = filter;

    document
        .querySelectorAll(".filters button")
        .forEach(button => {
            button.classList.remove("active");
        });


    if (filter === "all") {
        allBtn.classList.add("active");
    }

    if (filter === "active") {
        activeBtn.classList.add("active");
    }

    if (filter === "completed") {
        completedBtn.classList.add("active");
    }

    if (filter === "favorites") {
        favoritesBtn.classList.add("active");
    }


    taskList.innerHTML = "";


    const search = searchInput.value
        .toLowerCase()
        .trim();


    tasks.forEach(task => {

        if (
            filter === "active" &&
            task.completed
        ) {
            return;
        }

        if (
            filter === "completed" &&
            !task.completed
        ) {
            return;
        }

        if (
            filter === "favorites" &&
            !task.favorite
        ) {
            return;
        }

        if (
            !task.text
                .toLowerCase()
                .includes(search)
        ) {
            return;
        }

        createTask(task);
    });


    /* ============================= */
    /* TASK COUNTER */
/* ============================= */

    const totalTasks = tasks.length;

    const completedTasks =
        tasks.filter(task => task.completed).length;

    const activeTasks =
        totalTasks - completedTasks;


    taskCount.textContent =
        `${activeTasks} tasks left • ` +
        `${completedTasks} completed • ` +
        `${totalTasks} total`;


    /* ============================= */
    /* EMPTY STATE */
/* ============================= */

    if (taskList.children.length === 0) {

        emptyMessage.style.display = "block";

        if (search !== "") {

            emptyMessage.textContent =
                "🔍 No matching tasks found";

        } else if (filter === "active") {

            emptyMessage.textContent =
                "🎉 No active tasks!";

        } else if (filter === "completed") {

            emptyMessage.textContent =
                "📝 No completed tasks yet";

        } else if (filter === "favorites") {

            emptyMessage.textContent =
                "⭐ No favorite tasks yet";

        } else {

            emptyMessage.textContent =
                "📝 No tasks found. Add a new task to get started!";
        }

    } else {

        emptyMessage.style.display = "none";
    }
}


/* ============================= */
/* ADD TASK */
/* ============================= */

function addTask() {

    const text = taskInput.value.trim();

    if (!text) {

        taskInput.focus();

        return;
    }


    /*
     * Empty priority is now completely valid.
     * It will not crash the task rendering.
     */

    const newTask = {

        id: Date.now() + Math.floor(Math.random() * 1000),

        text: text,

        completed: false,

        priority:
            priority.value === "low" ||
            priority.value === "medium" ||
            priority.value === "high"
                ? priority.value
                : "",

        favorite: false,

        dueDate: dueDateInput.value || "",

        category: categoryInput.value || "personal"
    };


    tasks.push(newTask);

    saveTasks();

    renderTasks(currentFilter);


    /* RESET INPUTS */

    taskInput.value = "";

    priority.value = "";

    dueDateInput.value = "";

    categoryInput.value = "personal";


    taskInput.focus();
}


/* ============================= */
/* ADD BUTTON */
/* ============================= */

addBtn.addEventListener("click", addTask);


/* ============================= */
/* ENTER KEY */
/* ============================= */

taskInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        event.preventDefault();

        addTask();
    }
});


/* ============================= */
/* FILTERS */
/* ============================= */

allBtn.addEventListener(
    "click",
    () => renderTasks("all")
);

activeBtn.addEventListener(
    "click",
    () => renderTasks("active")
);

completedBtn.addEventListener(
    "click",
    () => renderTasks("completed")
);

favoritesBtn.addEventListener(
    "click",
    () => renderTasks("favorites")
);


/* ============================= */
/* CLEAR COMPLETED */
/* ============================= */

clearCompletedBtn.addEventListener("click", () => {

    const hasCompletedTasks =
        tasks.some(task => task.completed);

    if (!hasCompletedTasks) {
        return;
    }

    tasks = tasks.filter(
        task => !task.completed
    );

    saveTasks();

    renderTasks(currentFilter);
});


/* ============================= */
/* SEARCH */
/* ============================= */

searchInput.addEventListener("input", () => {

    renderTasks(currentFilter);
});


/* ============================= */
/* DARK MODE */
/* ============================= */

function loadDarkMode() {

    const darkMode =
        localStorage.getItem("darkMode");

    if (darkMode === "enabled") {

        document.body.classList.add("dark");

        toggleMode.textContent =
            "☀️ Light Mode";

    } else {

        document.body.classList.remove("dark");

        toggleMode.textContent =
            "🌙 Dark Mode";
    }
}


loadDarkMode();


toggleMode.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    const enabled =
        document.body.classList.contains("dark");

    localStorage.setItem(
        "darkMode",
        enabled ? "enabled" : "disabled"
    );

    toggleMode.textContent =
        enabled
            ? "☀️ Light Mode"
            : "🌙 Dark Mode";
});


/* ============================= */
/* UNDO DELETE */
/* ============================= */

function showUndo(deletedTask, originalIndex) {

    /* Remove previous undo box */
    document
        .querySelectorAll(".undo-box")
        .forEach(box => box.remove());


    const undoBox =
        document.createElement("div");

    undoBox.className = "undo-box";


    const message =
        document.createElement("span");

    message.textContent =
        "🗑️ Task deleted";


    const undoButton =
        document.createElement("button");

    undoButton.type = "button";

    undoButton.textContent =
        "Undo";


    undoBox.append(
        message,
        undoButton
    );


    document
        .querySelector(".container")
        .appendChild(undoBox);


    let undoUsed = false;


    const removeUndoBox = () => {

        if (undoBox.isConnected) {
            undoBox.remove();
        }
    };


    const undoTimer =
        setTimeout(removeUndoBox, 5000);


    undoButton.addEventListener("click", () => {

        if (undoUsed) {
            return;
        }

        undoUsed = true;

        clearTimeout(undoTimer);


        const safeIndex =
            Math.min(
                Math.max(originalIndex, 0),
                tasks.length
            );


        tasks.splice(
            safeIndex,
            0,
            deletedTask
        );


        saveTasks();

        renderTasks(currentFilter);

        removeUndoBox();
    });
}


/* ============================= */
/* INITIAL RENDER */
/* ============================= */

renderTasks("all");
```
