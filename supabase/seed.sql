-- Seed data — replace 'YOUR_USER_ID' with a real auth.users UUID after signing up

-- Demo projects
insert into projects (user_id, name, description, status, priority, progress, deadline, project_type, color) values
  ('YOUR_USER_ID', 'Sly Systems Website', 'Redesign and launch the Sly Systems portfolio site', 'active', 'high', 65, current_date + 30, 'Web Design', '#ef4444'),
  ('YOUR_USER_ID', 'Cybersecurity Cert', 'Study and pass CompTIA Security+', 'active', 'high', 40, current_date + 90, 'Study', '#3b82f6'),
  ('YOUR_USER_ID', 'Budget Restructure', 'Rebuild full monthly budget and savings plan', 'planning', 'medium', 10, current_date + 14, 'Finance', '#10b981');

-- Demo tasks
insert into tasks (user_id, title, status, priority, due_date, tags) values
  ('YOUR_USER_ID', 'Review Supabase schema', 'in_progress', 'high', current_date, '{dev,supabase}'),
  ('YOUR_USER_ID', 'Morning skincare routine', 'done', 'medium', current_date, '{health,skincare}'),
  ('YOUR_USER_ID', 'Gym — Push day', 'not_started', 'medium', current_date, '{gym,fitness}'),
  ('YOUR_USER_ID', 'Study: Networking fundamentals', 'not_started', 'high', current_date + 1, '{study,cybersec}'),
  ('YOUR_USER_ID', 'Pay electricity bill', 'not_started', 'high', current_date + 3, '{finance,bills}');

-- Demo habits
insert into habits (user_id, name, description, icon, color, frequency) values
  ('YOUR_USER_ID', 'Gym', 'Hit the gym at least 4x per week', '🏋️', '#ef4444', 'daily'),
  ('YOUR_USER_ID', 'Morning Skincare', 'Full AM routine', '🧴', '#a78bfa', 'daily'),
  ('YOUR_USER_ID', 'Night Skincare', 'Full PM routine', '🌙', '#6366f1', 'daily'),
  ('YOUR_USER_ID', 'Drink 2L Water', 'Stay hydrated', '💧', '#3b82f6', 'daily'),
  ('YOUR_USER_ID', 'Study Session', '1hr+ focused study', '📚', '#f59e0b', 'daily'),
  ('YOUR_USER_ID', 'No Nicotine', 'Stay smoke-free', '🚫', '#10b981', 'daily'),
  ('YOUR_USER_ID', '7+ Hours Sleep', 'Get enough rest', '😴', '#8b5cf6', 'daily');

-- Demo learning paths
insert into learning_paths (user_id, name, description, icon, color, progress) values
  ('YOUR_USER_ID', 'Cybersecurity', 'Path to becoming a cybersecurity professional', '🔐', '#ef4444', 35),
  ('YOUR_USER_ID', 'Web Development', 'Full-stack web development skills', '💻', '#3b82f6', 55),
  ('YOUR_USER_ID', 'Networking', 'CompTIA Network+ and beyond', '🌐', '#10b981', 20),
  ('YOUR_USER_ID', 'Linux', 'Linux system administration', '🐧', '#f59e0b', 30);

-- Demo goals
insert into goals (user_id, title, description, category, timeframe, status, progress, deadline) values
  ('YOUR_USER_ID', 'Save $5,000 emergency fund', 'Build a 3-month emergency fund', 'money', 'yearly', 'in_progress', 30, current_date + 180),
  ('YOUR_USER_ID', 'Get CompTIA Security+', 'Pass the Security+ exam', 'study', 'yearly', 'in_progress', 40, current_date + 90),
  ('YOUR_USER_ID', 'Hit 80kg bodyweight', 'Lean bulk to 80kg', 'fitness', 'monthly', 'in_progress', 60, current_date + 60),
  ('YOUR_USER_ID', 'Launch Sly Systems site', 'Get first client from new site', 'business', 'monthly', 'in_progress', 65, current_date + 30);

-- Demo bills
insert into bills (user_id, name, amount, due_date, frequency, category) values
  ('YOUR_USER_ID', 'Electricity', 180.00, current_date + 5, 'monthly', 'utilities'),
  ('YOUR_USER_ID', 'Phone Plan', 55.00, current_date + 12, 'monthly', 'phone'),
  ('YOUR_USER_ID', 'Internet', 89.00, current_date + 18, 'monthly', 'utilities'),
  ('YOUR_USER_ID', 'Gym Membership', 60.00, current_date + 7, 'monthly', 'fitness');

-- Demo subscriptions
insert into subscriptions (user_id, name, amount, billing_cycle, next_billing_date, category, is_active) values
  ('YOUR_USER_ID', 'Netflix', 22.99, 'monthly', current_date + 14, 'entertainment', true),
  ('YOUR_USER_ID', 'Spotify', 11.99, 'monthly', current_date + 20, 'entertainment', true),
  ('YOUR_USER_ID', 'ChatGPT Plus', 28.00, 'monthly', current_date + 8, 'software', true),
  ('YOUR_USER_ID', 'GitHub Pro', 4.00, 'monthly', current_date + 25, 'software', true),
  ('YOUR_USER_ID', 'Claude Pro', 28.00, 'monthly', current_date + 10, 'software', true);

-- Demo products
insert into products (user_id, name, brand, category, price, status, rebuy, rating) values
  ('YOUR_USER_ID', 'Cerave Hydrating Cleanser', 'CeraVe', 'skincare', 18.99, 'active', true, 5),
  ('YOUR_USER_ID', 'Niacinamide 10% Zinc', 'The Ordinary', 'skincare', 9.99, 'running_low', true, 4),
  ('YOUR_USER_ID', 'SPF 50 Sunscreen', 'Neutrogena', 'skincare', 14.99, 'active', true, 5),
  ('YOUR_USER_ID', 'Creatine Monohydrate', 'ON', 'supplements', 49.99, 'active', true, 5),
  ('YOUR_USER_ID', 'Whey Protein', 'Optimum Nutrition', 'supplements', 89.99, 'running_low', true, 5);

-- Demo health log (today)
insert into health_logs (user_id, log_date, sleep_hours, mood, energy, water_ml) values
  ('YOUR_USER_ID', current_date, 7.5, 7, 8, 1500);

-- Demo reminders
insert into reminders (user_id, title, description, reminder_type, due_date) values
  ('YOUR_USER_ID', 'Pay Electricity Bill', 'AGL - $180 due', 'bill', current_date + 5),
  ('YOUR_USER_ID', 'Buy more Niacinamide', 'Running low on The Ordinary Niacinamide', 'product', current_date + 3),
  ('YOUR_USER_ID', 'Netflix renewal', 'Monthly subscription renews', 'subscription', current_date + 14);
