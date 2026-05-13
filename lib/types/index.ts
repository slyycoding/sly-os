import type { Database } from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Profile = Tables<"profiles">;
export type Task = Tables<"tasks">;
export type Project = Tables<"projects">;
export type ProjectMilestone = Tables<"project_milestones">;
export type ProjectLog = Tables<"project_logs">;
export type Note = Tables<"notes">;
export type GymLog = Tables<"gym_logs">;
export type Exercise = Tables<"exercises">;
export type SkincareLog = Tables<"skincare_logs">;
export type Product = Tables<"products">;
export type Income = Tables<"income">;
export type Expense = Tables<"expenses">;
export type Debt = Tables<"debts">;
export type Bill = Tables<"bills">;
export type Subscription = Tables<"subscriptions">;
export type SavingsGoal = Tables<"savings_goals">;
export type Habit = Tables<"habits">;
export type HabitLog = Tables<"habit_logs">;
export type Goal = Tables<"goals">;
export type LearningPath = Tables<"learning_paths">;
export type LearningTopic = Tables<"learning_topics">;
export type LearningResource = Tables<"learning_resources">;
export type StudySession = Tables<"study_sessions">;
export type Certificate = Tables<"certificates">;
export type HealthLog = Tables<"health_logs">;
export type Reminder = Tables<"reminders">;
export type CalendarEvent = Tables<"calendar_events">;

export type Priority = "low" | "medium" | "high";
export type TaskStatus = "not_started" | "in_progress" | "done";
export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export type GoalCategory = "money" | "fitness" | "study" | "business" | "health" | "personal";
export type GoalTimeframe = "daily" | "weekly" | "monthly" | "yearly";
export type ProductCategory = "skincare" | "gym" | "tech" | "supplements" | "grooming" | "food" | "software" | "other";
export type TopicStatus = "not_started" | "learning" | "completed" | "needs_revision";
export type ResourceType = "video" | "article" | "course" | "book" | "docs" | "other";
export type EventType = "work_shift" | "study" | "gym" | "appointment" | "deadline" | "reminder" | "personal";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
}
