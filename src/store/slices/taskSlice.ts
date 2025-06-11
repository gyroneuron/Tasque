import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Task, TaskFilter, TaskSort } from "@/src/types/index";
import { storageService } from "@/src/services/storage";
import { apiService } from "@/src/services/api";


const TASK_COLORS = ['#FFF84E', '#FFA3FF', '#91F7FF', '#90FFA5', '#A5AAFF'];
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sort: TaskSort;
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filter: "all",
  sort: "dueDate",
};

export const fetchInitialTasks = createAsyncThunk(
  'tasks/fetchInitial',
  async () => {
    try {
      const remoteTasks = await apiService.fetchTodos();
      const localTasks = await storageService.getTasks();

      const convertedTasks: Task[] = remoteTasks.map(todo => ({
        id: `remote-${todo.id}`,
        title: todo.title,
        description: '',
        dueDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Task['priority'],
        completed: todo.completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        color: TASK_COLORS[Math.floor(Math.random() * TASK_COLORS.length)],
      }));

      const allTasks = [...(convertedTasks ?? []), ...(localTasks ?? [])]; // <- Prevent undefined
      const uniqueTasks = Array.from(new Map(allTasks.map(t => [t.id, t])).values());

      await storageService.saveTasks(uniqueTasks);
      return uniqueTasks;
    } catch (error) {
      console.error('fetchInitialTasks error:', error);
      const localTasks = await storageService.getTasks();
      return localTasks ?? [];
    }
  }
);


export const addTask = createAsyncThunk(
  "tasks/add",
  async (taskData: Omit<Task, "id" | "createdAt" | "updatedAt">) => {
    const newTask: Task = {
      ...taskData,
      color: taskData.color || TASK_COLORS[0], // <-- Ensure color is set
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const currentTasks = await storageService.getTasks();
    const updatedTasks = [...currentTasks, newTask];
    await storageService.saveTasks(updatedTasks);
    return newTask;
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async (updatedTask: Task) => {
    const currentTasks = await storageService.getTasks();
    const updatedTasks = currentTasks.map((task) =>
      task.id === updatedTask.id
        ? { ...updatedTask, updatedAt: new Date().toISOString() }
        : task
    );
    await storageService.saveTasks(updatedTasks);
    return updatedTask;
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async (taskId: string) => {
    const currentTasks = await storageService.getTasks();
    const updatedTasks = currentTasks.filter((task) => task.id !== taskId);
    await storageService.saveTasks(updatedTasks);
    return taskId;
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<TaskFilter>) => {
      state.filter = action.payload;
    },
    setSort: (state, action: PayloadAction<TaskSort>) => {
      state.sort = action.payload;
    },
    toggleTaskStatus: (state, action: PayloadAction<string>) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInitialTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchInitialTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch tasks";
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      });
  },
});

export const { setFilter, setSort, toggleTaskStatus } = taskSlice.actions;
export default taskSlice.reducer;
