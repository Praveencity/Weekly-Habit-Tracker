import Task from "../models/Task.js";

const parseTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => tag.trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const normalizeTask = (task) => ({
  ...task,
  tags: parseTags(task.tags),
});

export const getTasks = async (request, response, next) => {
  try {
    const { status, search } = request.query;
    const filters = {};

    if (status && status !== "all") {
      filters.status = status;
    }

    if (search) {
      filters.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const tasks = await Task.find(filters).sort({ createdAt: -1 });
    response.json(tasks);
  } catch (error) {
    next(error);
  }
};

export const createTask = async (request, response, next) => {
  try {
    const payload = normalizeTask(request.body);
    const task = await Task.create(payload);
    response.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (request, response, next) => {
  try {
    const payload = normalizeTask(request.body);
    const task = await Task.findByIdAndUpdate(request.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!task) {
      return response.status(404).json({ message: "Task not found" });
    }

    response.json(task);
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (request, response, next) => {
  try {
    const task = await Task.findByIdAndDelete(request.params.id);

    if (!task) {
      return response.status(404).json({ message: "Task not found" });
    }

    response.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
};
