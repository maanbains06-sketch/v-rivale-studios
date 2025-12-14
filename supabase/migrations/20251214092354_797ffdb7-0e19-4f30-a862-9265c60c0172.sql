-- Drop the existing constraint and add 'management' as a valid department
ALTER TABLE staff_members DROP CONSTRAINT IF EXISTS staff_members_department_check;

ALTER TABLE staff_members ADD CONSTRAINT staff_members_department_check 
CHECK (department IN ('leadership', 'administration', 'management', 'development', 'moderation', 'support', 'staff', 'events'));