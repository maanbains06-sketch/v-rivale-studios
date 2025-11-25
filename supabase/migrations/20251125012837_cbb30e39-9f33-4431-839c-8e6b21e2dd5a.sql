-- Fix search path for remaining function - drop with correct names
DROP TRIGGER IF EXISTS ban_appeals_status_notification ON ban_appeals;
DROP TRIGGER IF EXISTS gallery_submissions_status_notification ON gallery_submissions;
DROP TRIGGER IF EXISTS job_applications_status_notification ON job_applications;
DROP TRIGGER IF EXISTS whitelist_applications_status_notification ON whitelist_applications;
DROP TRIGGER IF EXISTS staff_applications_status_notification ON staff_applications;

DROP FUNCTION IF EXISTS create_status_notification();

CREATE OR REPLACE FUNCTION create_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN TG_TABLE_NAME = 'ban_appeals' THEN 'Ban Appeal ' || NEW.status
        WHEN TG_TABLE_NAME = 'gallery_submissions' THEN 'Gallery Submission ' || NEW.status
        WHEN TG_TABLE_NAME = 'job_applications' THEN 'Job Application ' || NEW.status
        WHEN TG_TABLE_NAME = 'whitelist_applications' THEN 'Whitelist Application ' || NEW.status
        WHEN TG_TABLE_NAME = 'staff_applications' THEN 'Staff Application ' || NEW.status
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your application has been approved! Check your dashboard for details.'
        WHEN NEW.status = 'rejected' THEN 'Your application has been reviewed. Please check your dashboard for feedback.'
        ELSE 'Your application status has been updated to: ' || NEW.status
      END,
      TG_TABLE_NAME,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate triggers with original names
CREATE TRIGGER ban_appeals_status_notification
  AFTER UPDATE ON ban_appeals
  FOR EACH ROW
  EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER gallery_submissions_status_notification
  AFTER UPDATE ON gallery_submissions
  FOR EACH ROW
  EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER job_applications_status_notification
  AFTER UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER whitelist_applications_status_notification
  AFTER UPDATE ON whitelist_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_status_notification();

CREATE TRIGGER staff_applications_status_notification
  AFTER UPDATE ON staff_applications
  FOR EACH ROW
  EXECUTE FUNCTION create_status_notification();