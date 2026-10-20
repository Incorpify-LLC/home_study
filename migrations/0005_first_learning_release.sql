-- First reviewed Mathematics and Accountancy learning release.
-- Content is original and linked to authoritative curriculum sources.

PRAGMA foreign_keys = ON;

CREATE TABLE curriculum_sources (
  id TEXT PRIMARY KEY,
  publisher TEXT NOT NULL,
  title TEXT NOT NULL,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('official_curriculum', 'supplementary_textbook')),
  source_url TEXT NOT NULL UNIQUE,
  publication_label TEXT,
  retrieved_at TEXT NOT NULL,
  scope_note TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'retired')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curriculum_topic_sources (
  topic_id TEXT NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES curriculum_sources(id),
  relationship TEXT NOT NULL CHECK (relationship IN ('authoritative_scope', 'supplementary_reference')),
  PRIMARY KEY (topic_id, source_id)
);

CREATE TABLE learning_modules (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES curriculum_topics(id),
  title TEXT NOT NULL,
  overview TEXT NOT NULL,
  key_points_json TEXT NOT NULL,
  worked_example_json TEXT NOT NULL,
  practice_advice TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'retired')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assignment_templates (
  id TEXT PRIMARY KEY,
  module_id TEXT NOT NULL REFERENCES learning_modules(id),
  class_level TEXT NOT NULL,
  subject TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  estimated_minutes INTEGER NOT NULL CHECK (estimated_minutes > 0),
  review_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'reviewed', 'retired')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX assignment_templates_active_class_subject
  ON assignment_templates (class_level, subject)
  WHERE active = 1 AND review_status = 'reviewed';

CREATE TABLE assignment_template_items (
  template_id TEXT NOT NULL REFERENCES assignment_templates(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (template_id, question_id),
  UNIQUE (template_id, position)
);

ALTER TABLE assignments ADD COLUMN template_id TEXT REFERENCES assignment_templates(id);
ALTER TABLE assignments ADD COLUMN started_at TEXT;
ALTER TABLE assignments ADD COLUMN submitted_at TEXT;

CREATE UNIQUE INDEX assignments_student_template
  ON assignments (student_id, template_id)
  WHERE template_id IS NOT NULL;

CREATE TABLE assignment_responses (
  assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  answer_json TEXT NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  elapsed_seconds INTEGER CHECK (elapsed_seconds >= 0),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id, question_id)
);

CREATE UNIQUE INDEX attempts_assignment_question
  ON attempts (assignment_id, question_id);

INSERT INTO curriculum_sources
  (id, publisher, title, source_kind, source_url, publication_label, retrieved_at, scope_note, review_status)
VALUES
  ('src-cisce-upper-primary-math', 'CISCE', 'Curriculum for Upper Primary Classes (VI-VIII)', 'official_curriculum', 'https://cisce.org/wp-content/uploads/2025/03/UpperPrimary.pdf', 'First edition, November 2016', '2026-10-20', 'Authoritative CISCE Class VIII curriculum framework; not a 2027 board examination syllabus.', 'reviewed'),
  ('src-cisce-icse-math-2027', 'CISCE', 'ICSE Mathematics (51), Examination Year 2027', 'official_curriculum', 'https://cisce.org/wp-content/uploads/2025/03/9.-Mathematics.pdf', 'February 2025', '2026-10-20', 'Authoritative Class X examination scope for 2027.', 'reviewed'),
  ('src-cisce-isc-accountancy-2027', 'CISCE', 'ISC Accountancy (858), Examination Year 2027', 'official_curriculum', 'https://cisce.org/wp-content/uploads/2025/04/15.-ISC-Accountancy.docx.pdf', 'February 2025', '2026-10-20', 'Authoritative Class XII examination scope for 2027.', 'reviewed'),
  ('src-ncert-grade8-math', 'NCERT', 'Ganita Prakash, Grade 8, Parts I and II', 'supplementary_textbook', 'https://ncert.nic.in/textbook.php', '2026-27 editions', '2026-10-20', 'Supplementary concept and pedagogy reference; not a substitute for CISCE scope.', 'reviewed'),
  ('src-ncert-class10-math', 'NCERT', 'Mathematics, Textbook for Class X', 'supplementary_textbook', 'https://ncert.nic.in/textbook/pdf/jemh1ps.pdf', 'Reprint 2026-27', '2026-10-20', 'Supplementary concept reference where topics overlap with ICSE.', 'reviewed'),
  ('src-ncert-class12-accountancy', 'NCERT', 'Accountancy, Textbooks for Class XII', 'supplementary_textbook', 'https://ncert.nic.in/textbook/pdf/leac1ps.pdf', 'Reprint 2026-27', '2026-10-20', 'Supplementary concept reference where topics overlap with ISC.', 'reviewed');

INSERT INTO curriculum_topics
  (id, board, exam_year, class_level, subject, unit, topic, learning_objective, source_url, source_retrieved_at, review_status, version)
VALUES
  ('topic-viii-rational-exponents', 'CISCE', NULL, 'VIII', 'Mathematics', 'Number System', 'Rational numbers and integral exponents', 'Represent and compare rational numbers, apply rational-number properties, and use the laws of integral exponents with understanding.', 'https://cisce.org/wp-content/uploads/2025/03/UpperPrimary.pdf', '2026-10-20', 'reviewed', 1),
  ('topic-x-quadratics', 'CISCE', 2027, 'X', 'Mathematics', 'Algebra', 'Quadratic equations', 'Recognise quadratic equations, determine the nature of roots, solve by factorisation or formula, and model simple situations.', 'https://cisce.org/wp-content/uploads/2025/03/9.-Mathematics.pdf', '2026-10-20', 'reviewed', 1),
  ('topic-xii-partnership-fundamentals', 'CISCE', 2027, 'XII', 'Accountancy', 'Partnership Accounts', 'Fundamentals of partnership', 'Apply partnership-deed provisions and statutory defaults to appropriation, fixed and fluctuating capitals, guarantees, and past adjustments.', 'https://cisce.org/wp-content/uploads/2025/04/15.-ISC-Accountancy.docx.pdf', '2026-10-20', 'reviewed', 1);

INSERT INTO curriculum_topic_sources (topic_id, source_id, relationship)
VALUES
  ('topic-viii-rational-exponents', 'src-cisce-upper-primary-math', 'authoritative_scope'),
  ('topic-viii-rational-exponents', 'src-ncert-grade8-math', 'supplementary_reference'),
  ('topic-x-quadratics', 'src-cisce-icse-math-2027', 'authoritative_scope'),
  ('topic-x-quadratics', 'src-ncert-class10-math', 'supplementary_reference'),
  ('topic-xii-partnership-fundamentals', 'src-cisce-isc-accountancy-2027', 'authoritative_scope'),
  ('topic-xii-partnership-fundamentals', 'src-ncert-class12-accountancy', 'supplementary_reference');

INSERT INTO learning_modules
  (id, topic_id, title, overview, key_points_json, worked_example_json, practice_advice, review_status, version)
VALUES
  (
    'module-viii-rational-exponents',
    'topic-viii-rational-exponents',
    'Rational numbers and integral exponents',
    'A rational number can be written as p/q where p and q are integers and q is not zero. The same number may have many equivalent forms. Exponents provide a compact way to describe repeated multiplication, including reciprocal powers when an exponent is negative.',
    '["Compare rational numbers by using a common denominator or their positions on a number line.","The reciprocal of a non-zero rational number a/b is b/a; zero has no reciprocal.","For the same non-zero base, multiply powers by adding exponents and divide powers by subtracting exponents.","A negative exponent means a reciprocal: a^(-n) = 1/a^n for a not equal to zero."]',
    '{"prompt":"Evaluate 2^(-2) × 2^5.","steps":["The base is the same, so add the exponents: -2 + 5 = 3.","Therefore the expression is 2^3.","Compute 2 × 2 × 2."],"answer":"8"}',
    'Write one reason for each step. When fractions are involved, estimate first so an impossible sign or size is easier to spot.',
    'reviewed',
    1
  ),
  (
    'module-x-quadratics',
    'topic-x-quadratics',
    'Quadratic equations',
    'A quadratic equation in one variable can be written as ax² + bx + c = 0, where a is not zero. It may be solved by factorisation or by the quadratic formula. The discriminant b² − 4ac tells us whether real roots are distinct, equal, or absent.',
    '["First arrange the equation in standard form ax² + bx + c = 0.","For factorisation, find two factors whose product is ac and whose sum is b.","If b² − 4ac is positive there are two distinct real roots; if zero, two equal roots; if negative, no real roots.","Check a proposed root by substituting it into the original equation."]',
    '{"prompt":"Solve x² − 7x + 12 = 0 by factorisation.","steps":["Find two numbers with product 12 and sum -7: -3 and -4.","Write (x − 3)(x − 4) = 0.","Set each factor to zero."],"answer":"x = 3 or x = 4"}',
    'Keep the equation balanced and verify both roots in the original equation. A correct final pair without a valid method is not yet secure evidence.',
    'reviewed',
    1
  ),
  (
    'module-xii-partnership-fundamentals',
    'topic-xii-partnership-fundamentals',
    'Fundamentals of partnership accounts',
    'Partnership accounting separates charges against profit from appropriations of profit. The partnership deed controls items such as interest on capital, salary, commission, and the profit-sharing ratio. Where the deed is silent, the Indian Partnership Act supplies default rules.',
    '["Interest on a partner loan is a charge against profit; interest on capital is an appropriation when authorised by the deed.","With fixed capitals, routine appropriations and drawings pass through current accounts.","In the absence of a stated profit-sharing ratio, partners share profits equally.","A past adjustment records the net correction needed after comparing what each partner received with what each should have received."]',
    '{"prompt":"A and B share profits equally. Interest on capital of ₹8,000 for A and ₹2,000 for B was omitted after ₹60,000 profit had already been divided.","steps":["A should receive ₹8,000 interest and B ₹2,000, leaving ₹50,000 to share equally.","Correct entitlements are A ₹33,000 and B ₹27,000.","Both originally received ₹30,000, so A is credited and B is debited by ₹3,000."],"answer":"Credit A ₹3,000 and debit B ₹3,000."}',
    'Label each amount before calculating: charge, appropriation, capital item, or current-account item. This prevents mechanically placing an amount in the wrong account.',
    'reviewed',
    1
  );

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
  ('viii-rational-between', 'topic-viii-rational-exponents', 'single_choice', 'Which rational number lies between 2/5 and 3/5?', '[{"id":"a","label":"1/5"},{"id":"b","label":"1/2"},{"id":"c","label":"4/5"},{"id":"d","label":"3/4"}]', '{"choice":"b"}', 'Write both bounds in tenths: 2/5 = 4/10 and 3/5 = 6/10. Therefore 5/10 = 1/2 lies between them.', 1, 0, 'reviewed', 1),
  ('viii-rational-add', 'topic-viii-rational-exponents', 'numeric', 'Calculate −3/4 + 3/2. Give the answer as a decimal.', NULL, '{"value":0.75,"tolerance":0.000001}', 'Use denominator 4: −3/4 + 6/4 = 3/4 = 0.75.', 2, 1, 'reviewed', 1),
  ('viii-rational-inverse', 'topic-viii-rational-exponents', 'single_choice', 'What is the multiplicative inverse of −5/7?', '[{"id":"a","label":"5/7"},{"id":"b","label":"−5/7"},{"id":"c","label":"−7/5"},{"id":"d","label":"7/5"}]', '{"choice":"c"}', 'A non-zero number and its reciprocal multiply to 1. (−5/7) × (−7/5) = 1.', 1, 0, 'reviewed', 1),
  ('viii-exponent-product', 'topic-viii-rational-exponents', 'numeric', 'Evaluate 3^(−2) × 3^5.', NULL, '{"value":27,"tolerance":0}', 'Add exponents for the same base: 3^(−2+5) = 3^3 = 27.', 2, 1, 'reviewed', 1),
  ('viii-exponent-negative', 'topic-viii-rational-exponents', 'numeric', 'Write 2^(−3) as a decimal.', NULL, '{"value":0.125,"tolerance":0.000001}', '2^(−3) = 1/2^3 = 1/8 = 0.125.', 2, 1, 'reviewed', 1),
  ('viii-rational-word', 'topic-viii-rational-exponents', 'numeric', 'A container held 3/4 litre of water. After 1/2 litre was used, how many litres remained? Give the answer as a decimal.', NULL, '{"value":0.25,"tolerance":0.000001}', 'Subtract using fourths: 3/4 − 1/2 = 3/4 − 2/4 = 1/4 = 0.25 litre.', 2, 1, 'reviewed', 1),

  ('x-quadratic-roots', 'topic-x-quadratics', 'single_choice', 'Which pair gives the roots of x² − 5x + 6 = 0?', '[{"id":"a","label":"1 and 6"},{"id":"b","label":"2 and 3"},{"id":"c","label":"−2 and −3"},{"id":"d","label":"−1 and −6"}]', '{"choice":"b"}', 'x² − 5x + 6 factors as (x − 2)(x − 3), so the roots are 2 and 3.', 1, 1, 'reviewed', 1),
  ('x-quadratic-equal', 'topic-x-quadratics', 'single_choice', 'What is the nature of the roots of x² − 4x + 4 = 0?', '[{"id":"a","label":"Two distinct real roots"},{"id":"b","label":"Two equal real roots"},{"id":"c","label":"No real roots"},{"id":"d","label":"Cannot be determined"}]', '{"choice":"b"}', 'The discriminant is (−4)² − 4(1)(4) = 0, so the real roots are equal.', 2, 1, 'reviewed', 1),
  ('x-quadratic-positive-root', 'topic-x-quadratics', 'numeric', 'For x² − 9 = 0, enter the positive root.', NULL, '{"value":3,"tolerance":0}', 'x² − 9 = (x − 3)(x + 3), so the roots are 3 and −3. The positive root is 3.', 1, 1, 'reviewed', 1),
  ('x-quadratic-context', 'topic-x-quadratics', 'numeric', 'The product of two consecutive positive integers is 72. Enter the smaller integer.', NULL, '{"value":8,"tolerance":0}', 'Let the smaller integer be n. Then n(n + 1) = 72, so n² + n − 72 = 0 = (n + 9)(n − 8). The positive solution is 8.', 3, 1, 'reviewed', 1),
  ('x-quadratic-factor', 'topic-x-quadratics', 'single_choice', 'Which is the complete factorisation of x² + x − 12?', '[{"id":"a","label":"(x + 4)(x − 3)"},{"id":"b","label":"(x − 4)(x + 3)"},{"id":"c","label":"(x + 6)(x − 2)"},{"id":"d","label":"(x − 6)(x + 2)"}]', '{"choice":"a"}', 'The required numbers have product −12 and sum 1: 4 and −3.', 2, 1, 'reviewed', 1),
  ('x-quadratic-no-real', 'topic-x-quadratics', 'single_choice', 'What is the nature of the roots of 2x² + x + 5 = 0?', '[{"id":"a","label":"Two distinct real roots"},{"id":"b","label":"Two equal real roots"},{"id":"c","label":"No real roots"},{"id":"d","label":"One root is zero"}]', '{"choice":"c"}', 'The discriminant is 1² − 4(2)(5) = −39. A negative discriminant means there are no real roots.', 2, 1, 'reviewed', 1),

  ('xii-partnership-equal-share', 'topic-xii-partnership-fundamentals', 'numeric', 'A, B and C have no agreed profit-sharing ratio. If divisible profit is ₹90,000, how much is credited to B?', NULL, '{"value":30000,"tolerance":0}', 'When the partnership deed does not specify a ratio, partners share profit equally. ₹90,000 ÷ 3 = ₹30,000.', 1, 1, 'reviewed', 1),
  ('xii-partnership-loan-interest', 'topic-xii-partnership-fundamentals', 'single_choice', 'How is interest on a loan given by a partner to the firm treated?', '[{"id":"a","label":"An appropriation of profit"},{"id":"b","label":"A charge against profit"},{"id":"c","label":"A drawing by the partner"},{"id":"d","label":"A transfer to general reserve"}]', '{"choice":"b"}', 'Interest on a partner’s loan to the firm is a charge against profit and is credited to the partner’s loan account.', 1, 0, 'reviewed', 1),
  ('xii-partnership-fixed-capital', 'topic-xii-partnership-fundamentals', 'single_choice', 'Under the fixed-capital method, where is a partner’s annual salary normally recorded?', '[{"id":"a","label":"The partner’s current account"},{"id":"b","label":"The partner’s loan account"},{"id":"c","label":"The firm’s cash account only"},{"id":"d","label":"The partner’s fixed capital account"}]', '{"choice":"a"}', 'With fixed capitals, recurring appropriations such as salary and interest on capital are recorded in partners’ current accounts.', 1, 0, 'reviewed', 1),
  ('xii-partnership-commission', 'topic-xii-partnership-fundamentals', 'numeric', 'Profit before charging a manager’s commission is ₹110,000. Commission is 10% of profit after charging the commission. Enter the commission in rupees.', NULL, '{"value":10000,"tolerance":0}', 'Commission after charge = ₹110,000 × 10/110 = ₹10,000.', 2, 1, 'reviewed', 1),
  ('xii-partnership-past-adjustment', 'topic-xii-partnership-fundamentals', 'numeric', 'A and B share profits equally. Interest on capital of ₹8,000 for A and ₹2,000 for B was omitted after ₹60,000 profit had been divided equally. Enter the net amount to credit A in the adjustment entry.', NULL, '{"value":3000,"tolerance":0}', 'Correct shares are A ₹33,000 and B ₹27,000. Since each already received ₹30,000, A is credited ₹3,000 and B is debited ₹3,000.', 3, 1, 'reviewed', 1),
  ('xii-partnership-deed-silent', 'topic-xii-partnership-fundamentals', 'single_choice', 'The partnership deed is silent about interest on capital. What should the firm do?', '[{"id":"a","label":"Allow interest at 6% per annum"},{"id":"b","label":"Allow interest at the bank rate"},{"id":"c","label":"Allow no interest on capital"},{"id":"d","label":"Allow interest only when there is a loss"}]', '{"choice":"c"}', 'In the absence of an agreement in the deed, no interest on partners’ capital is allowed.', 1, 0, 'reviewed', 1);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version)
VALUES
  ('template-viii-rational-exponents', 'module-viii-rational-exponents', 'VIII', 'Mathematics', 'Rational numbers and exponents · diagnostic 1', 'Read the short lesson, answer all six questions, and show rough work where requested. Save as you go; submit only when ready for corrections.', 35, 'reviewed', 1, 1),
  ('template-x-quadratics', 'module-x-quadratics', 'X', 'Mathematics', 'Quadratic equations · diagnostic 1', 'Work without an answer key. Record the method on paper for every question marked as requiring rough work, then submit for automatic corrections.', 40, 'reviewed', 1, 1),
  ('template-xii-partnership-fundamentals', 'module-xii-partnership-fundamentals', 'XII', 'Accountancy', 'Partnership fundamentals · diagnostic 1', 'Classify each item before calculating. Complete all six questions and retain supporting workings for review.', 45, 'reviewed', 1, 1);

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
  ('template-viii-rational-exponents', 'viii-rational-between', 0),
  ('template-viii-rational-exponents', 'viii-rational-add', 1),
  ('template-viii-rational-exponents', 'viii-rational-inverse', 2),
  ('template-viii-rational-exponents', 'viii-exponent-product', 3),
  ('template-viii-rational-exponents', 'viii-exponent-negative', 4),
  ('template-viii-rational-exponents', 'viii-rational-word', 5),
  ('template-x-quadratics', 'x-quadratic-roots', 0),
  ('template-x-quadratics', 'x-quadratic-equal', 1),
  ('template-x-quadratics', 'x-quadratic-positive-root', 2),
  ('template-x-quadratics', 'x-quadratic-context', 3),
  ('template-x-quadratics', 'x-quadratic-factor', 4),
  ('template-x-quadratics', 'x-quadratic-no-real', 5),
  ('template-xii-partnership-fundamentals', 'xii-partnership-equal-share', 0),
  ('template-xii-partnership-fundamentals', 'xii-partnership-loan-interest', 1),
  ('template-xii-partnership-fundamentals', 'xii-partnership-fixed-capital', 2),
  ('template-xii-partnership-fundamentals', 'xii-partnership-commission', 3),
  ('template-xii-partnership-fundamentals', 'xii-partnership-past-adjustment', 4),
  ('template-xii-partnership-fundamentals', 'xii-partnership-deed-silent', 5);
