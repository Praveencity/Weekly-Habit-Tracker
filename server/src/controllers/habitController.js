import DayLog from "../models/DayLog.js";
import DayDatabase from "../models/DayDatabase.js";
import WeekPlan from "../models/WeekPlan.js";
import { getLocalDateKey, getMonthKey, normalizeWeekday, weekdayOrder } from "../utils/date.js";

const createEmptyPlan = (weekday) => ({
  weekday,
  title: `${weekday} Plan`,
  tasks: [],
});

const isClockValue = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || "").trim());

const sanitizeTasks = (tasks = []) =>
  tasks
    .map((task, index) => {
      const startTime = String(task.startTime || "").trim();
      const endTime = String(task.endTime || "").trim();
      const legacyTime = String(task.time || "").trim();

      return {
        title: String(task.title || "").trim(),
        time: legacyTime,
        startTime: isClockValue(startTime) ? startTime : isClockValue(legacyTime) ? legacyTime : "",
        endTime: isClockValue(endTime) ? endTime : "",
        type: String(task.type || "General").trim(),
        notes: String(task.notes || "").trim(),
        order: Number.isFinite(Number(task.order)) ? Number(task.order) : index,
      };
    })
    .filter((task) => task.title.length > 0)
    .sort((firstTask, secondTask) => firstTask.order - secondTask.order);

const formatPlan = (plan, weekday) => ({
  weekday,
  title: plan?.title || `${weekday} Plan`,
  tasks: Array.isArray(plan?.tasks) ? plan.tasks : [],
});

const sanitizeCompletedIds = (completedTaskIds = []) =>
  Array.isArray(completedTaskIds) ? [...new Set(completedTaskIds.map(String))] : [];

const sanitizeDatabaseItems = (items = []) =>
  items
    .map((item, index) => ({
      title: String(item.title || "").trim(),
      type: String(item.type || "Task").trim(),
      notes: String(item.notes || "").trim(),
      done: Boolean(item.done),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
    }))
    .filter((item) => item.title.length > 0)
    .sort((firstItem, secondItem) => firstItem.order - secondItem.order);

const getStatus = (completedCount, totalTasks) => {
  if (totalTasks === 0 || completedCount === 0) {
    return "none";
  }

  if (completedCount >= totalTasks) {
    return "complete";
  }

  return "partial";
};

const getMonthBounds = (monthKey = getMonthKey()) => {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const startKey = getLocalDateKey(start);
  const endKey = getLocalDateKey(end);
  return { startKey, endKey };
};

const computeCurrentStreak = (logs) => {
  const logMap = new Map(logs.map((log) => [log.date, log]));
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const dateKey = getLocalDateKey(cursor);
    const log = logMap.get(dateKey);
    if (!log || log.status !== "complete") {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const getUserId = (request) => request.user._id;

const getPlanMap = async (userId) => {
  const plans = await WeekPlan.find({ userId }).lean();
  return plans.reduce((accumulator, plan) => {
    accumulator[plan.weekday] = formatPlan(plan, plan.weekday);
    return accumulator;
  }, {});
};

const buildResponsePlans = (planMap) =>
  weekdayOrder.map((weekday) => planMap[weekday] || createEmptyPlan(weekday));

export const getPlans = async (request, response, next) => {
  try {
    const planMap = await getPlanMap(getUserId(request));
    response.json(buildResponsePlans(planMap));
  } catch (error) {
    next(error);
  }
};

export const savePlan = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const weekday = normalizeWeekday(request.params.weekday);
    const payload = {
      userId,
      weekday,
      title: String(request.body.title || `${weekday} Plan`).trim(),
      tasks: sanitizeTasks(request.body.tasks),
    };

    const plan = await WeekPlan.findOneAndUpdate(
      { userId, weekday },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    response.json(formatPlan(plan.toObject(), weekday));
  } catch (error) {
    next(error);
  }
};

export const copyPlan = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const sourceWeekday = normalizeWeekday(request.body.sourceWeekday);
    const targetWeekday = normalizeWeekday(request.body.targetWeekday);

    const sourcePlan = await WeekPlan.findOne({ userId, weekday: sourceWeekday }).lean();
    if (!sourcePlan) {
      return response.status(404).json({ message: `${sourceWeekday} plan not found` });
    }

    const payload = {
      userId,
      weekday: targetWeekday,
      title: request.body.title ? String(request.body.title).trim() : `${targetWeekday} Plan`,
      tasks: sanitizeTasks(sourcePlan.tasks).map((task, index) => ({
        title: task.title,
        time: task.time,
        startTime: task.startTime,
        endTime: task.endTime,
        type: task.type,
        notes: task.notes,
        order: Number.isFinite(task.order) ? task.order : index,
      })),
    };

    const plan = await WeekPlan.findOneAndUpdate(
      { userId, weekday: targetWeekday },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    response.json(formatPlan(plan.toObject(), targetWeekday));
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const monthKey = request.query.month ? String(request.query.month) : getMonthKey();
    const { startKey, endKey } = getMonthBounds(monthKey);
    const logs = await DayLog.find({ userId, date: { $gte: startKey, $lte: endKey } }).sort({ date: 1 }).lean();
    response.json(logs);
  } catch (error) {
    next(error);
  }
};

export const saveLog = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const date = String(request.params.date || getLocalDateKey()).trim();
    const weekday = normalizeWeekday(request.body.weekday);
    const completedTaskIds = sanitizeCompletedIds(request.body.completedTaskIds);
    const totalTasks = Number.isFinite(Number(request.body.totalTasks))
      ? Number(request.body.totalTasks)
      : completedTaskIds.length;
    const completedCount = completedTaskIds.length;
    const status = getStatus(completedCount, totalTasks);

    const log = await DayLog.findOneAndUpdate(
      { userId, date },
      { userId, date, weekday, completedTaskIds, totalTasks, completedCount, status },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    response.json(log);
  } catch (error) {
    next(error);
  }
};

export const getSummary = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const monthKey = request.query.month ? String(request.query.month) : getMonthKey();
    const { startKey, endKey } = getMonthBounds(monthKey);
    const monthLogs = await DayLog.find({ userId, date: { $gte: startKey, $lte: endKey } }).sort({ date: 1 }).lean();
    const allLogs = await DayLog.find({ userId }).sort({ date: 1 }).lean();
    const streak = computeCurrentStreak(allLogs);
    const completionRate = monthLogs.length === 0
      ? 0
      : Math.round((monthLogs.filter((log) => log.status === "complete").length / monthLogs.length) * 100);

    response.json({
      streak,
      completionRate,
      completedDays: monthLogs.filter((log) => log.status === "complete").length,
      partialDays: monthLogs.filter((log) => log.status === "partial").length,
      emptyDays: monthLogs.filter((log) => log.status === "none").length,
      monthKey,
    });
  } catch (error) {
    next(error);
  }
};

export const getDayDatabase = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const date = String(request.params.date || getLocalDateKey()).trim();
    const database = await DayDatabase.findOne({ userId, date }).lean();

    if (!database) {
      return response.json({ date, title: "", items: [] });
    }

    response.json({
      date,
      title: database.title || "",
      items: Array.isArray(database.items) ? database.items : [],
    });
  } catch (error) {
    next(error);
  }
};

export const saveDayDatabase = async (request, response, next) => {
  try {
    const userId = getUserId(request);
    const date = String(request.params.date || getLocalDateKey()).trim();
    const payload = {
      userId,
      date,
      title: String(request.body.title || "").trim(),
      items: sanitizeDatabaseItems(request.body.items),
    };

    const database = await DayDatabase.findOneAndUpdate(
      { userId, date },
      payload,
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    response.json({
      date,
      title: database.title || "",
      items: Array.isArray(database.items) ? database.items : [],
    });
  } catch (error) {
    next(error);
  }
};
