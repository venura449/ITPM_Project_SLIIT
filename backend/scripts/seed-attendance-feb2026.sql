-- ============================================================
-- Seed February 2026 attendance records for all active employees
-- Working days: Mon–Fri only (20 working days)
-- Feb: 2-6, 9-13, 16-20, 23-27
-- Run with: mysql -u root -p itpm_db < seed-attendance-feb2026.sql
-- ============================================================
USE itpm_db;

INSERT IGNORE INTO attendance (employee_id, attendance_date, status, marked_at)
SELECT e.id, d.attendance_date, 'Present', NOW()
FROM employees e
CROSS JOIN (
  SELECT '2026-02-02' AS attendance_date UNION ALL
  SELECT '2026-02-03' UNION ALL
  SELECT '2026-02-04' UNION ALL
  SELECT '2026-02-05' UNION ALL
  SELECT '2026-02-06' UNION ALL
  SELECT '2026-02-09' UNION ALL
  SELECT '2026-02-10' UNION ALL
  SELECT '2026-02-11' UNION ALL
  SELECT '2026-02-12' UNION ALL
  SELECT '2026-02-13' UNION ALL
  SELECT '2026-02-16' UNION ALL
  SELECT '2026-02-17' UNION ALL
  SELECT '2026-02-18' UNION ALL
  SELECT '2026-02-19' UNION ALL
  SELECT '2026-02-20' UNION ALL
  SELECT '2026-02-23' UNION ALL
  SELECT '2026-02-24' UNION ALL
  SELECT '2026-02-25' UNION ALL
  SELECT '2026-02-26' UNION ALL
  SELECT '2026-02-27'
) d
WHERE e.status != 'Resigned';

-- Verify: should show 20 rows per employee
SELECT e.name, e.employee_id, COUNT(*) AS feb_days
FROM attendance a
JOIN employees e ON e.id = a.employee_id
WHERE MONTH(a.attendance_date) = 2 AND YEAR(a.attendance_date) = 2026
GROUP BY e.id, e.name, e.employee_id
ORDER BY e.name;
