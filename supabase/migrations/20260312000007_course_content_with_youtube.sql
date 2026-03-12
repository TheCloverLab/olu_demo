-- Add course content (courses → chapters → lessons) with YouTube video URLs
-- for the 4 new workspaces

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- Coach Mika — Strength Training Academy (experience 13)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000001', '06000000-0000-0000-0000-000000000013', 'Beginner Strength Fundamentals', 'Build a solid foundation with proper form and progressive overload.', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000001', '0c000000-0000-0000-0000-000000000001', 'Getting Started', 0),
  ('0c100000-0000-0000-0000-000000000002', '0c000000-0000-0000-0000-000000000001', 'Upper Body', 1),
  ('0c100000-0000-0000-0000-000000000003', '0c000000-0000-0000-0000-000000000001', 'Lower Body & Core', 2);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000001', '0c100000-0000-0000-0000-000000000001', 'Welcome & Equipment Setup', 'Everything you need to get started with strength training at home or in the gym.', 'https://www.youtube.com/watch?v=ixkQaZXVQjs', 0),
  ('0c200000-0000-0000-0000-000000000002', '0c100000-0000-0000-0000-000000000001', 'Warm-Up Routine', 'A proper warm-up prevents injury and improves performance. Follow this 10-minute routine before every session.', 'https://www.youtube.com/watch?v=jRmUbCmjMko', 1),
  ('0c200000-0000-0000-0000-000000000003', '0c100000-0000-0000-0000-000000000002', 'Push-Up Progressions', 'From wall push-ups to diamond push-ups — master this fundamental movement pattern.', 'https://www.youtube.com/watch?v=IODxDxX7oi4', 0),
  ('0c200000-0000-0000-0000-000000000004', '0c100000-0000-0000-0000-000000000002', 'Dumbbell Rows & Pulls', 'Build a strong back with proper rowing technique using dumbbells or bands.', 'https://www.youtube.com/watch?v=pYcpY20QaE8', 1),
  ('0c200000-0000-0000-0000-000000000005', '0c100000-0000-0000-0000-000000000003', 'Squat Fundamentals', 'The squat is king. Learn bodyweight squats, goblet squats, and proper depth.', 'https://www.youtube.com/watch?v=YaXPRqUwItQ', 0),
  ('0c200000-0000-0000-0000-000000000006', '0c100000-0000-0000-0000-000000000003', 'Core Stability & Planks', 'Build a bulletproof core with planks, dead bugs, and pallof presses.', 'https://www.youtube.com/watch?v=ASdvN_XEl_c', 1);

-- ═══════════════════════════════════════════════════════════════════
-- Ren Tanaka — Photography Masterclass (experience 16)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000002', '06000000-0000-0000-0000-000000000016', 'Photography Fundamentals', 'Master exposure, composition, and light — the three pillars of great photography.', 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000004', '0c000000-0000-0000-0000-000000000002', 'Understanding Your Camera', 0),
  ('0c100000-0000-0000-0000-000000000005', '0c000000-0000-0000-0000-000000000002', 'Composition & Framing', 1),
  ('0c100000-0000-0000-0000-000000000006', '0c000000-0000-0000-0000-000000000002', 'Light & Editing', 2);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000007', '0c100000-0000-0000-0000-000000000004', 'Exposure Triangle Explained', 'Understanding aperture, shutter speed, and ISO — the foundation of every photo.', 'https://www.youtube.com/watch?v=YojL7UQTVhc', 0),
  ('0c200000-0000-0000-0000-000000000008', '0c100000-0000-0000-0000-000000000004', 'Manual Mode Mastery', 'Stop shooting auto. Learn to take full control of your camera settings.', 'https://www.youtube.com/watch?v=MBuR2lMz6kI', 1),
  ('0c200000-0000-0000-0000-000000000009', '0c100000-0000-0000-0000-000000000005', 'Rule of Thirds & Beyond', 'Composition rules that make your photos stand out — and when to break them.', 'https://www.youtube.com/watch?v=VArISvUuyr0', 0),
  ('0c200000-0000-0000-0000-000000000010', '0c100000-0000-0000-0000-000000000005', 'Leading Lines & Perspective', 'Use natural lines and angles to guide the viewer''s eye through your image.', 'https://www.youtube.com/watch?v=N0z7zCVwJvU', 1),
  ('0c200000-0000-0000-0000-000000000011', '0c100000-0000-0000-0000-000000000006', 'Golden Hour Magic', 'Shooting in golden hour — the secret weapon of every photographer.', 'https://www.youtube.com/watch?v=K5iqwBSmSCo', 0),
  ('0c200000-0000-0000-0000-000000000012', '0c100000-0000-0000-0000-000000000006', 'Lightroom Editing Basics', 'Transform your RAW files into stunning images with these essential editing techniques.', 'https://www.youtube.com/watch?v=5lhYXwCDmEo', 1);

-- Ren Tanaka — Street Photography Workshop (experience 17)
INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000003', '06000000-0000-0000-0000-000000000017', 'Street Photography Essentials', 'Capture the energy of the city. Candid moments, urban landscapes, and storytelling.', 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000007', '0c000000-0000-0000-0000-000000000003', 'The Street Photographer''s Mindset', 0),
  ('0c100000-0000-0000-0000-000000000008', '0c000000-0000-0000-0000-000000000003', 'Techniques & Gear', 1);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000013', '0c100000-0000-0000-0000-000000000007', 'Seeing the Decisive Moment', 'Henri Cartier-Bresson said it best. Learn to anticipate and capture fleeting moments.', 'https://www.youtube.com/watch?v=NH0aEp1oDOI', 0),
  ('0c200000-0000-0000-0000-000000000014', '0c100000-0000-0000-0000-000000000007', 'Overcoming Fear of Shooting Strangers', 'Tips and ethics for photographing people in public spaces with confidence.', 'https://www.youtube.com/watch?v=JsGMfHbnBSM', 1),
  ('0c200000-0000-0000-0000-000000000015', '0c100000-0000-0000-0000-000000000008', 'Best Camera Settings for Street', 'Zone focusing, aperture priority, and other settings that keep you fast and sharp.', 'https://www.youtube.com/watch?v=FuYQBJBRyBw', 0);

-- ═══════════════════════════════════════════════════════════════════
-- Sarah Dev — Full-Stack Web Dev (experience 20)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000004', '06000000-0000-0000-0000-000000000020', 'Full-Stack Web Development', 'Build and deploy a complete web application from scratch using modern tools.', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000009', '0c000000-0000-0000-0000-000000000004', 'HTML & CSS Foundations', 0),
  ('0c100000-0000-0000-0000-000000000010', '0c000000-0000-0000-0000-000000000004', 'JavaScript Essentials', 1),
  ('0c100000-0000-0000-0000-000000000011', '0c000000-0000-0000-0000-000000000004', 'React & Deployment', 2);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000016', '0c100000-0000-0000-0000-000000000009', 'Your First Web Page', 'Write HTML from scratch and understand the structure of a web page.', 'https://www.youtube.com/watch?v=UB1O30fR-EE', 0),
  ('0c200000-0000-0000-0000-000000000017', '0c100000-0000-0000-0000-000000000009', 'CSS Flexbox & Grid', 'Modern layout techniques that make responsive design intuitive and powerful.', 'https://www.youtube.com/watch?v=JJSoEo8JSnc', 1),
  ('0c200000-0000-0000-0000-000000000018', '0c100000-0000-0000-0000-000000000010', 'JavaScript Fundamentals', 'Variables, functions, arrays, and the DOM — everything you need to make pages interactive.', 'https://www.youtube.com/watch?v=W6NZfCO5SIk', 0),
  ('0c200000-0000-0000-0000-000000000019', '0c100000-0000-0000-0000-000000000010', 'Async JavaScript & APIs', 'Fetch data from APIs, handle promises, and build dynamic content.', 'https://www.youtube.com/watch?v=PoRJizFvM7s', 1),
  ('0c200000-0000-0000-0000-000000000020', '0c100000-0000-0000-0000-000000000011', 'React Crash Course', 'Components, state, props, and hooks — build your first React app.', 'https://www.youtube.com/watch?v=LDB4uaJ87e0', 0),
  ('0c200000-0000-0000-0000-000000000021', '0c100000-0000-0000-0000-000000000011', 'Deploy to Vercel', 'Ship your project to the world. CI/CD, environment variables, and custom domains.', 'https://www.youtube.com/watch?v=2HBIzEx6IZA', 1);

-- Sarah Dev — React & TypeScript Deep Dive (experience 22)
INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000005', '06000000-0000-0000-0000-000000000022', 'React & TypeScript Deep Dive', 'Advanced patterns, type safety, and production-ready React.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000012', '0c000000-0000-0000-0000-000000000005', 'TypeScript for React', 0),
  ('0c100000-0000-0000-0000-000000000013', '0c000000-0000-0000-0000-000000000005', 'Advanced Patterns', 1);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000022', '0c100000-0000-0000-0000-000000000012', 'TypeScript Basics for React Devs', 'Types, interfaces, generics — the TypeScript you actually need for React.', 'https://www.youtube.com/watch?v=TPACABQTHvM', 0),
  ('0c200000-0000-0000-0000-000000000023', '0c100000-0000-0000-0000-000000000012', 'Typing Props & Hooks', 'Properly type your components, custom hooks, and context providers.', 'https://www.youtube.com/watch?v=jrKcJxF0lAU', 1),
  ('0c200000-0000-0000-0000-000000000024', '0c100000-0000-0000-0000-000000000013', 'Compound Components Pattern', 'Build flexible, composable UI components like the pros.', 'https://www.youtube.com/watch?v=vPRdY87_SH0', 0),
  ('0c200000-0000-0000-0000-000000000025', '0c100000-0000-0000-0000-000000000013', 'Performance Optimization', 'useMemo, useCallback, React.memo — when to optimize and when to skip it.', 'https://www.youtube.com/watch?v=lGEMwh32soc', 1);

-- ═══════════════════════════════════════════════════════════════════
-- Chef Marco — Italian Cooking Basics (experience 26)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000006', '06000000-0000-0000-0000-000000000026', 'Italian Cooking Essentials', 'Master the foundations of Italian cuisine — sauces, pasta, and technique.', 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000014', '0c000000-0000-0000-0000-000000000006', 'Italian Kitchen Basics', 0),
  ('0c100000-0000-0000-0000-000000000015', '0c000000-0000-0000-0000-000000000006', 'Classic Sauces', 1),
  ('0c100000-0000-0000-0000-000000000016', '0c000000-0000-0000-0000-000000000006', 'Everyday Italian', 2);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000026', '0c100000-0000-0000-0000-000000000014', 'Essential Italian Pantry', 'Stock your kitchen with these key Italian ingredients — olive oil, San Marzano tomatoes, Parmigiano-Reggiano.', 'https://www.youtube.com/watch?v=bJUiWdM__Qw', 0),
  ('0c200000-0000-0000-0000-000000000027', '0c100000-0000-0000-0000-000000000014', 'Knife Skills for Home Cooks', 'Proper technique for chopping, dicing, and julienning — save time and fingers.', 'https://www.youtube.com/watch?v=JMA2SqaDgG8', 1),
  ('0c200000-0000-0000-0000-000000000028', '0c100000-0000-0000-0000-000000000015', 'Perfect Marinara Sauce', 'The mother of all Italian sauces. Simple, fresh, and ready in 30 minutes.', 'https://www.youtube.com/watch?v=bsYnIjIbsOI', 0),
  ('0c200000-0000-0000-0000-000000000029', '0c100000-0000-0000-0000-000000000015', 'Authentic Carbonara', 'Eggs, guanciale, Pecorino Romano — no cream, no shortcuts, just perfection.', 'https://www.youtube.com/watch?v=D_2DBLAt57c', 1),
  ('0c200000-0000-0000-0000-000000000030', '0c100000-0000-0000-0000-000000000016', 'Risotto alla Milanese', 'Creamy saffron risotto — the secret is patience, butter, and constant stirring.', 'https://www.youtube.com/watch?v=VOhFJz3ikYc', 0),
  ('0c200000-0000-0000-0000-000000000031', '0c100000-0000-0000-0000-000000000016', 'Bruschetta Three Ways', 'Classic tomato, mushroom truffle, and ricotta honey — perfect antipasti.', 'https://www.youtube.com/watch?v=gmIrrGSrdKE', 1);

-- Chef Marco — Pasta from Scratch (experience 28)
INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000007', '06000000-0000-0000-0000-000000000028', 'Handmade Pasta Masterclass', 'From flour and eggs to perfect pasta shapes — the art of pasta making.', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&q=80', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000017', '0c000000-0000-0000-0000-000000000007', 'The Dough', 0),
  ('0c100000-0000-0000-0000-000000000018', '0c000000-0000-0000-0000-000000000007', 'Classic Shapes', 1);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000032', '0c100000-0000-0000-0000-000000000017', 'Perfect Pasta Dough', 'The basic egg pasta dough recipe that forms the foundation of all fresh pasta.', 'https://www.youtube.com/watch?v=HdSLKZ6LN94', 0),
  ('0c200000-0000-0000-0000-000000000033', '0c100000-0000-0000-0000-000000000017', 'Kneading & Resting', 'Proper kneading technique and why resting the dough is crucial for texture.', 'https://www.youtube.com/watch?v=KmGMvaKpbM0', 1),
  ('0c200000-0000-0000-0000-000000000034', '0c100000-0000-0000-0000-000000000018', 'Tagliatelle & Fettuccine', 'Roll, fold, and cut — the easiest shapes to start with.', 'https://www.youtube.com/watch?v=8QjLaEbSxyI', 0),
  ('0c200000-0000-0000-0000-000000000035', '0c100000-0000-0000-0000-000000000018', 'Ravioli Filling & Shaping', 'Classic ricotta and spinach filling, plus tips for sealing without air bubbles.', 'https://www.youtube.com/watch?v=W9F-jx7pryA', 1);

-- ═══════════════════════════════════════════════════════════════════
-- Also add courses for Luna's Digital Art Academy (experience 03)
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO experience_courses (id, experience_id, name, description, cover, position, status) VALUES
  ('0c000000-0000-0000-0000-000000000008', '06000000-0000-0000-0000-000000000003', 'Digital Painting from Zero', 'Start your digital art journey with Procreate and Photoshop.', '/images/covers/gamingsetup.jpg', 0, 'published');

INSERT INTO experience_course_chapters (id, course_id, title, position) VALUES
  ('0c100000-0000-0000-0000-000000000019', '0c000000-0000-0000-0000-000000000008', 'Getting Started', 0),
  ('0c100000-0000-0000-0000-000000000020', '0c000000-0000-0000-0000-000000000008', 'Core Techniques', 1),
  ('0c100000-0000-0000-0000-000000000021', '0c000000-0000-0000-0000-000000000008', 'Advanced Projects', 2);

INSERT INTO experience_course_lessons (id, chapter_id, title, content, video_url, position) VALUES
  ('0c200000-0000-0000-0000-000000000036', '0c100000-0000-0000-0000-000000000019', 'Welcome & Course Overview', 'Everything you need to know about this course and setting up your tools.', 'https://www.youtube.com/watch?v=iwRa5qTnr8o', 0),
  ('0c200000-0000-0000-0000-000000000037', '0c100000-0000-0000-0000-000000000019', 'Setting Up Your Workspace', 'Configure your tablet, brushes, and workspace for maximum productivity.', 'https://www.youtube.com/watch?v=k9p-UJ4jZx8', 1),
  ('0c200000-0000-0000-0000-000000000038', '0c100000-0000-0000-0000-000000000019', 'Understanding Digital Color Theory', 'HSB, RGB, and color harmonies — the science behind beautiful palettes.', 'https://www.youtube.com/watch?v=AvgCkHrcj90', 2),
  ('0c200000-0000-0000-0000-000000000039', '0c100000-0000-0000-0000-000000000020', 'Layering & Blending Modes', 'Master Procreate layers, clipping masks, and blend modes for professional results.', 'https://www.youtube.com/watch?v=DEE3jL50aUI', 0),
  ('0c200000-0000-0000-0000-000000000040', '0c100000-0000-0000-0000-000000000020', 'Light & Shadow Fundamentals', 'Add depth and dimension to your art with proper lighting techniques.', 'https://www.youtube.com/watch?v=V3WmrWUEIJo', 1),
  ('0c200000-0000-0000-0000-000000000041', '0c100000-0000-0000-0000-000000000021', 'Cyberpunk Cityscape Project', 'Apply everything you learned in a complete cyberpunk scene from sketch to finish.', 'https://www.youtube.com/watch?v=3jBMFCr5aP4', 0),
  ('0c200000-0000-0000-0000-000000000042', '0c100000-0000-0000-0000-000000000021', 'Character Portrait Workshop', 'Design and paint an original character portrait with full rendering.', 'https://www.youtube.com/watch?v=VhRkfpv-r4s', 1);

COMMIT;
