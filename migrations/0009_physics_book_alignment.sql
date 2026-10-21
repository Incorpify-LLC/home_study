-- Align the Class X Physics track with the school-prescribed textbook
-- Selina Concise Physics, Part II (Class X), March 2027 edition: twelve chapters.
-- Two chapters that were previously folded together (Lens with Spectrum, and Current
-- Electricity with Household Circuits) become separate chapters. All teaching text and
-- questions are original Home Study material written from the CISCE scope.

PRAGMA foreign_keys = ON;

INSERT INTO curriculum_sources
  (id, publisher, title, source_kind, source_url, publication_label, retrieved_at, scope_note, review_status)
VALUES
  ('src-selina-concise-physics-x', 'Selina Publishers Pvt. Ltd.', 'Concise Physics — I.C.S.E., Part II (Class X), by R. P. Goyal and S. P. Tripathi', 'supplementary_textbook', 'https://selinapublishers.in/', 'Edition for the March 2027 Examination of Class X', '2026-10-21', 'School-prescribed Class X Physics text. Its twelve chapters control the sequencing and grouping of the Home Study Physics track; the CISCE ICSE Science (52) syllabus remains the authority on what is examinable.', 'reviewed');

INSERT INTO curriculum_topics
  (id, board, exam_year, class_level, subject, unit, topic, learning_objective, source_url, source_retrieved_at, review_status, version)
VALUES
  ('topic-x-physics-spectrum', 'CISCE', 2027, 'X', 'Physics', 'Light', 'Spectrum', 'Explain dispersion of white light, the order and properties of the electromagnetic spectrum, and everyday effects of scattering.', 'https://cisce.org/wp-content/uploads/2025/03/10.-Physics.pdf', '2026-10-21', 'reviewed', 1),
  ('topic-x-physics-household-circuits', 'CISCE', 2027, 'X', 'Physics', 'Electricity and Magnetism', 'Household Circuits', 'Describe domestic wiring, the purpose of live, neutral and earth wires, fuse and MCB protection, and calculate household energy consumption and cost.', 'https://cisce.org/wp-content/uploads/2025/03/10.-Physics.pdf', '2026-10-21', 'reviewed', 1);

INSERT INTO curriculum_topic_sources (topic_id, source_id, relationship)
VALUES
  ('topic-x-physics-spectrum', 'src-cisce-icse-physics-2027', 'authoritative_scope'),
  ('topic-x-physics-household-circuits', 'src-cisce-icse-physics-2027', 'authoritative_scope');

INSERT INTO curriculum_topic_sources (topic_id, source_id, relationship)
VALUES
  ('topic-x-physics-turning-forces', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-work-energy-power', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-machines-conservation-energy', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-refraction-tir', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-lenses-spectrum-scattering', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-spectrum', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-sound', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-electricity', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-household-circuits', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-magnetism-induction', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-heat-calorimetry', 'src-selina-concise-physics-x', 'supplementary_reference'),
  ('topic-x-physics-modern-physics', 'src-selina-concise-physics-x', 'supplementary_reference');

INSERT INTO learning_modules
  (id, topic_id, title, overview, key_points_json, worked_example_json, practice_advice, review_status, version)
VALUES
  ('module-x-physics-spectrum', 'topic-x-physics-spectrum', 'Spectrum', 'White light from the sun or a lamp is a mixture of colours. When a narrow beam of white light passes through a triangular glass prism it is split into a band of colours called a spectrum, an effect studied first by Newton. The colours, in order of increasing wavelength, are violet, indigo, blue, green, yellow, orange and red. Because the refractive index of glass is greater for shorter wavelengths, violet is deviated most and red least, and the band therefore spreads out. The colours can be recombined into white light by passing them through a second identical prism held inverted with respect to the first. Beyond the visible band lie invisible radiations which, together with visible light, form the electromagnetic spectrum: in order of increasing wavelength these are gamma rays, X-rays, ultraviolet radiation, visible light, infrared radiation, microwaves and radio waves, all travelling at the same speed in vacuum. Infrared radiation is used in remote controls, night-vision equipment and radiant heaters, while ultraviolet radiation sterilises water and instruments, helps the skin to make vitamin D and is used to detect forged currency. Scattering of light by air molecules, which is stronger for shorter wavelengths, makes the clear sky look blue and the sun look red near the horizon.', '["Dispersion is the splitting of white light into its component colours by a prism; the band of colours is called the spectrum and is ordered violet, indigo, blue, green, yellow, orange, red.", "Deviation by a prism is greatest for violet and least for red, because the refractive index of the glass is larger for shorter wavelengths.", "The electromagnetic spectrum, in order of increasing wavelength, is gamma rays, X-rays, ultraviolet, visible light, infrared, microwaves and radio waves; all travel at the speed of light in vacuum, so a shorter wavelength means a higher frequency.", "Scattering by air molecules becomes stronger as the wavelength decreases, which is why the daytime sky is blue and the sun appears red near the horizon; the Tyndall effect demonstrates the same scattering by larger particles."]', '{"prompt": "Red light of wavelength 700 nm travels through vacuum at 3.0 × 10⁸ m/s. Calculate the frequency of this light, and state which visible colour deviates least when white light passes through a glass prism.", "steps": ["Convert the wavelength to metres: 700 nm = 700 × 10⁻⁹ m = 7.0 × 10⁻⁷ m.", "Use the wave equation for electromagnetic radiation, c = f λ, rearranged as f = c / λ = (3.0 × 10⁸ m/s) / (7.0 × 10⁻⁷ m).", "Evaluate the division: f = 4.29 × 10¹⁴ Hz, which is about 4.3 × 10¹⁴ Hz.", "Red has the longest wavelength among the visible colours, so its refractive index in glass is the smallest and it is deviated least by the prism."], "answer": "f ≈ 4.3 × 10¹⁴ Hz; red is deviated least."}', 'Keep the two orderings separate: the colour order inside visible light, and the wider electromagnetic spectrum ordered by wavelength. Whenever a question gives a wavelength together with the speed of the radiation, reach for c = f λ.', 'reviewed', 1),
  ('module-x-physics-household-circuits', 'topic-x-physics-household-circuits', 'Household Circuits', 'Mains electricity reaches a home through the live wire, which is at a high potential, and the neutral wire, which is at nearly zero potential. A third wire, the earth wire, is connected both to the metal body of an appliance and to the ground, so that a fault sends current safely to earth instead of through the person touching the appliance. Appliances are connected in parallel across the supply so that each receives the full mains voltage and can be switched independently. Switches and fuses are always placed in the live wire, so that when a switch is open no part of the appliance remains at a high potential. A fuse is a short length of wire with a low melting point that melts and breaks the circuit when the current exceeds its rated value, while a miniature circuit breaker does the same job and can be reset. Overloading, from too many high-power appliances on one circuit, and short circuits are the main hazards of domestic wiring. The earth pin of a three-pin plug is longer and thicker than the other two so that it makes its connection first and breaks it last, two-way switches allow one lamp to be controlled from either end of a staircase, and the energy consumed is charged in kilowatt-hours.', '["The live wire carries current to the appliance, the neutral wire completes the circuit, and the earth wire connects the metal body of an appliance to the ground so that a fault current flows harmlessly to earth.", "Three-core cable colour coding is live brown, neutral light blue and earth green with yellow stripes; older wiring used live red, neutral black and earth green.", "Switches and fuses are fitted in the live wire; a fuse melts when the current exceeds its rating, an MCB trips and can be reset, and the earth pin of a three-pin plug is longer and thicker so that it connects first and disconnects last.", "Overloading and short circuits are the main domestic hazards, and household energy is billed in kilowatt-hours, where 1 kWh = 3.6 × 10⁶ J."]', '{"prompt": "A house uses five lamps of 60 W each for 5 hours a day and a 1500 W geyser for 30 minutes a day. Calculate the energy consumed in 30 days in kilowatt-hours, and the cost at ₹6.00 per kWh.", "steps": ["Lamps each day: five 60 W lamps draw 5 × 60 = 300 W = 0.3 kW, so in 5 hours they use 0.3 × 5 = 1.5 kWh.", "Geyser each day: 1500 W = 1.5 kW switched on for 0.5 hour uses 1.5 × 0.5 = 0.75 kWh.", "Daily total = 1.5 + 0.75 = 2.25 kWh, so over 30 days the consumption is 2.25 × 30 = 67.5 kWh.", "Cost = 67.5 kWh × ₹6.00 per kWh = ₹405."], "answer": "67.5 kWh, costing ₹405"}', 'Work in kilowatts and hours before converting, and keep watts and kilowatts from getting mixed. For safety questions, explain the reason physically: which wire must break, and what path the fault current takes.', 'reviewed', 1);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
  ('x-physics-lens-q6', 'topic-x-physics-lenses-spectrum-scattering', 'single_choice', 'A ray of light passes through the optical centre of a thin lens. How does the ray emerge from the lens?', '[{"id": "a", "label": "It travels straight on without any deviation."}, {"id": "b", "label": "It bends towards the principal focus on the far side."}, {"id": "c", "label": "It emerges parallel to the principal axis."}, {"id": "d", "label": "It is reflected back along its own path."}]', '{"choice": "a"}', 'The optical centre is the point where the lens behaves as a very thin parallel-sided sheet, so the refraction at the first surface is cancelled by the second and the ray continues undeviated.', 2, 0, 'reviewed', 1),
  ('x-physics-lens-q7', 'topic-x-physics-lenses-spectrum-scattering', 'single_choice', 'An object is placed between a convex lens and its principal focus. What kind of image is formed?', '[{"id": "a", "label": "Virtual, erect and magnified, on the same side of the lens as the object."}, {"id": "b", "label": "Real, inverted and magnified, on the far side of the lens."}, {"id": "c", "label": "Real, inverted and diminished, on the far side of the lens."}, {"id": "d", "label": "Virtual, erect and diminished, on the same side as the object."}]', '{"choice": "a"}', 'When the object lies within the focal length the refracted rays diverge, so the image is formed by extending them backwards: it is virtual, erect and larger than the object, which is the arrangement used in a magnifying glass.', 2, 0, 'reviewed', 1),
  ('x-physics-spectrum-q1', 'topic-x-physics-spectrum', 'single_choice', 'Which colour of white light is deviated most by a glass prism, and for what reason?', '[{"id": "a", "label": "Violet, because glass has its greatest refractive index for the shortest visible wavelength."}, {"id": "b", "label": "Red, because it has the longest wavelength."}, {"id": "c", "label": "Green, because it lies in the middle of the spectrum."}, {"id": "d", "label": "All colours are deviated equally, so only brightness changes."}]', '{"choice": "a"}', 'Deviation grows with refractive index, and the refractive index of glass increases as the wavelength decreases. Violet has the shortest visible wavelength, so it is deviated most and red least.', 2, 0, 'reviewed', 1),
  ('x-physics-spectrum-q2', 'topic-x-physics-spectrum', 'single_choice', 'A second identical glass prism is placed next to the first one, inverted so that the spectrum from the first prism falls on it. What is observed on the screen beyond the second prism?', '[{"id": "a", "label": "The colours recombine and a patch of white light appears."}, {"id": "b", "label": "The spectrum becomes wider and more clearly separated."}, {"id": "c", "label": "Only the violet end survives and the rest is absorbed."}, {"id": "d", "label": "Nothing reaches the screen because the light is totally reflected."}]', '{"choice": "a"}', 'The second prism deviates the colours by equal amounts in the opposite sense, so each colour is returned to its original direction; the emergent beam is again a mixture of all colours and appears white.', 3, 0, 'reviewed', 1),
  ('x-physics-spectrum-q3', 'topic-x-physics-spectrum', 'numeric', 'Ultraviolet radiation of wavelength 3.0 × 10⁻⁷ m travels through vacuum at 3.0 × 10⁸ m/s. Calculate the frequency of this radiation in hertz.', NULL, '{"value": 1000000000000000.0, "tolerance": 20000000000000.0}', 'Using c = f λ, the frequency is f = c / λ = (3.0 × 10⁸ m/s) / (3.0 × 10⁻⁷ m) = 1.0 × 10¹⁵ Hz, which places the radiation in the ultraviolet region of the electromagnetic spectrum.', 2, 1, 'reviewed', 1),
  ('x-physics-spectrum-q4', 'topic-x-physics-spectrum', 'numeric', 'The infrared radiation emitted by a remote control has a wavelength of 1.0 × 10⁻⁵ m. Taking the speed of electromagnetic radiation in air as 3.0 × 10⁸ m/s, calculate its frequency in hertz.', NULL, '{"value": 30000000000000.0, "tolerance": 600000000000.0}', 'From c = f λ, f = c / λ = (3.0 × 10⁸ m/s) / (1.0 × 10⁻⁵ m) = 3.0 × 10¹³ Hz. The long wavelength and correspondingly low frequency identify the radiation as infrared.', 2, 1, 'reviewed', 1),
  ('x-physics-elec-q7', 'topic-x-physics-electricity', 'single_choice', 'Which of the following statements is a correct statement of Ohm’s law?', '[{"id": "a", "label": "The current through a metallic conductor is directly proportional to the potential difference across it, provided the temperature remains constant."}, {"id": "b", "label": "The current through a conductor is inversely proportional to the potential difference across it."}, {"id": "c", "label": "The resistance of every conductor increases when a current is passed through it."}, {"id": "d", "label": "The potential difference across a conductor is independent of the current through it."}]', '{"choice": "a"}', 'Ohm’s law is the proportionality V = I R obeyed by metallic conductors at constant temperature. If the temperature rises, the resistance changes and the proportionality no longer holds exactly.', 2, 0, 'reviewed', 1),
  ('x-physics-elec-q8', 'topic-x-physics-electricity', 'single_choice', 'A uniform wire is stretched so that its length becomes twice the original length while its volume stays the same, so its area of cross-section becomes half. What happens to its resistance?', '[{"id": "a", "label": "It becomes four times the original resistance."}, {"id": "b", "label": "It becomes twice the original resistance."}, {"id": "c", "label": "It stays exactly the same."}, {"id": "d", "label": "It becomes half the original resistance."}]', '{"choice": "a"}', 'Resistance is R = ρ L / A. Doubling the length doubles the resistance, and halving the area doubles it again, so the resistance becomes four times as large.', 3, 1, 'reviewed', 1),
  ('x-physics-elec-q9', 'topic-x-physics-electricity', 'numeric', 'A steady current of 0.5 A flows through a conductor for 4 minutes. Calculate the charge that passes a point in the conductor, in coulombs.', NULL, '{"value": 120.0, "tolerance": 0.5}', 'Current is the rate of flow of charge, so Q = I t. With t = 4 minutes = 240 s, the charge is 0.5 × 240 = 120 C.', 1, 1, 'reviewed', 1),
  ('x-physics-elec-q10', 'topic-x-physics-electricity', 'single_choice', 'A cell with emf E and internal resistance r is delivering a current I to an external circuit. How does its terminal voltage compare with its emf?', '[{"id": "a", "label": "The terminal voltage is less than the emf by the potential drop I r inside the cell."}, {"id": "b", "label": "The terminal voltage is greater than the emf by I r."}, {"id": "c", "label": "The terminal voltage is always exactly equal to the emf."}, {"id": "d", "label": "The terminal voltage depends only on the external resistance and not on the current."}]', '{"choice": "a"}', 'Part of the emf is used up driving the current through the internal resistance, so the terminal voltage is V = E − I r and is smaller than the emf whenever current flows.', 3, 0, 'reviewed', 1),
  ('x-physics-household-q1', 'topic-x-physics-household-circuits', 'single_choice', 'Two two-way switches are fitted at the top and bottom of a staircase to control one lamp. Why is this arrangement used?', '[{"id": "a", "label": "Either switch can complete or break the circuit, so the lamp can be switched on or off from either end of the staircase."}, {"id": "b", "label": "It increases the brightness of the lamp by raising the current."}, {"id": "c", "label": "It reduces the energy consumed by the lamp."}, {"id": "d", "label": "It protects the lamp from a short circuit in the mains."}]', '{"choice": "a"}', 'The two switches are wired so that either one can connect the live wire through to the lamp. Whichever end the person uses, the state of the lamp can be changed, which is the standard staircase circuit.', 2, 0, 'reviewed', 1),
  ('x-physics-household-q2', 'topic-x-physics-household-circuits', 'numeric', 'A circuit on a 220 V mains supply is protected by a fuse rated at 5 A. Calculate the maximum power that can safely be drawn through this circuit, in watts.', NULL, '{"value": 1100.0, "tolerance": 5.0}', 'The fuse must carry the normal current of the circuit, so the maximum power is P = V I = 220 × 5 = 1100 W. Appliances drawing more than this would melt the fuse and break the circuit.', 2, 1, 'reviewed', 1);

UPDATE learning_modules SET
  title = 'Refraction through a Lens',
  overview = 'A lens is a transparent refracting medium bounded by two surfaces, at least one of which is curved. A convex lens is thicker at the centre and brings a parallel beam of light to a focus, so it is a converging lens; a concave lens is thinner at the centre and spreads the beam, so it is a diverging lens. A lens behaves like a collection of prisms: deviation increases with the angle of the prism, which is why the outer parts of a lens bend light more than its central part. The terms used to describe a lens are the centre of curvature, radius of curvature, principal axis, optical centre, principal focus and focal length. Three rays are enough to locate an image: a ray parallel to the principal axis passes through the principal focus after refraction, a ray through the optical centre passes undeviated, and a ray through the principal focus emerges parallel to the principal axis. An object placed beyond the focal length of a convex lens gives a real, inverted image, while an object between the lens and its focus gives a virtual, erect and magnified image, which is how a magnifying glass works. A concave lens always gives a virtual, erect and diminished image. Lens behaviour is described numerically by the lens formula, the magnification and the power of the lens.',
  key_points_json = '["A convex lens converges a parallel beam to its principal focus while a concave lens diverges it, and a lens acts as a set of prisms that deviate rays more strongly towards its edges.", "The lens formula is 1/v − 1/u = 1/f, the magnification is m = v/u, and the power of a lens is P = 1/f measured in dioptres, where 1 D = 1 m⁻¹ and a converging lens has positive power.", "Ray rules: a ray parallel to the principal axis passes through the principal focus, a ray through the optical centre is undeviated, and a ray through the principal focus emerges parallel to the principal axis.", "A convex lens gives a real, inverted image when the object lies beyond the focus and a virtual, erect, magnified image when the object is within the focal length, as in a magnifying glass, while a concave lens always gives a virtual, erect, diminished image."]',
  worked_example_json = '{"prompt": "A convex lens of focal length 20 cm forms an image of an object placed 30 cm in front of it. Using the lens formula, find the position of the image and its magnification.", "steps": ["Apply the sign convention: distances measured against the direction of the incident light are taken as negative, so u = −30 cm, and a converging lens has f = +20 cm.", "Substitute into the lens formula: 1/v = 1/f + 1/u = 1/20 − 1/30 = (3 − 2)/60 = 1/60 cm⁻¹.", "Therefore v = +60 cm, so the image is formed 60 cm behind the lens and is real.", "Magnification m = v/u = 60 / 30 = 2, so the image is inverted and twice as tall as the object."], "answer": "v = 60 cm behind the lens (real and inverted), magnification = 2"}',
  practice_advice = 'Fix the sign convention before substituting any numbers, and check the sign of v afterwards: a negative v means a virtual image on the same side as the object.',
  version = version + 1
WHERE id = 'module-x-physics-lenses-spectrum-scattering';

UPDATE learning_modules SET
  title = 'Current Electricity',
  overview = 'An electric current is the rate of flow of electric charge and is measured in amperes: a current of one ampere means one coulomb of charge passes a point each second, and the conventional direction of current is opposite to the flow of electrons. For a metallic conductor kept at constant temperature the current is directly proportional to the potential difference across its ends, which is Ohm’s law, V = I R. The resistance of a wire depends on its length, on its area of cross-section and on the material of which it is made, summarised as R = ρ L / A, where ρ is the resistivity, or specific resistance, of the material. Resistances joined in series add, Rₛ = R₁ + R₂, because the same current passes through each in turn, while for resistances in parallel it is the reciprocals that add, 1/Rₚ = 1/R₁ + 1/R₂, because each carries the same potential difference. A cell of emf E and internal resistance r drives a current I = E / (R + r) through an external resistance R, and the potential drop I r inside the cell means the terminal voltage V = E − I r is less than the emf whenever current flows. Electrical energy is transferred at the rate P = V I = I² R, and commercial energy is measured in kilowatt-hours.',
  key_points_json = '["Current is the rate of flow of charge, I = Q / t, and the conventional direction of current is opposite to the direction in which electrons drift.", "Ohm’s law states that the current through a metallic conductor is directly proportional to the potential difference across it at constant temperature, so V = I R with R measured in ohms.", "The resistance of a uniform wire is directly proportional to its length and inversely proportional to its area of cross-section, R = ρ L / A, where ρ is the resistivity of the material.", "For a cell of emf E and internal resistance r the current is I = E / (R + r) and the terminal voltage is V = E − I r, while electrical power is P = V I = I² R and 1 kWh = 3.6 × 10⁶ J."]',
  worked_example_json = '{"prompt": "A cell of emf 6.0 V and internal resistance 0.5 Ω is connected to an external resistor of 5.5 Ω. Calculate the current in the circuit, the terminal voltage of the cell, and the power dissipated in the external resistor.", "steps": ["Total resistance of the circuit is the external resistor plus the internal resistance: R + r = 5.5 + 0.5 = 6.0 Ω.", "Apply I = E / (R + r) = 6.0 V / 6.0 Ω = 1.0 A.", "Terminal voltage is V = E − I r = 6.0 − (1.0 × 0.5) = 5.5 V, which agrees with I R = 1.0 × 5.5 V.", "Power in the external resistor is P = I² R = (1.0)² × 5.5 = 5.5 W."], "answer": "I = 1.0 A, terminal voltage = 5.5 V, power = 5.5 W"}',
  practice_advice = 'Always separate the emf of the cell from the terminal voltage, and remember that the lost volts I r grow with the current. Check units before substituting: R = ρ L / A needs metres and square metres.',
  version = version + 1
WHERE id = 'module-x-physics-electricity';

UPDATE assignment_templates SET title = 'Force' WHERE id = 'template-x-physics-turning-forces';
UPDATE learning_modules SET title = 'Force', version = version + 1 WHERE id = 'module-x-physics-turning-forces';
UPDATE assignment_templates SET title = 'Work, Energy and Power' WHERE id = 'template-x-physics-work-energy-power';
UPDATE learning_modules SET title = 'Work, Energy and Power', version = version + 1 WHERE id = 'module-x-physics-work-energy-power';
UPDATE assignment_templates SET title = 'Machines' WHERE id = 'template-x-physics-machines-conservation-energy';
UPDATE learning_modules SET title = 'Machines', version = version + 1 WHERE id = 'module-x-physics-machines-conservation-energy';
UPDATE assignment_templates SET title = 'Refraction of Light at Plane Surfaces' WHERE id = 'template-x-physics-refraction-tir';
UPDATE learning_modules SET title = 'Refraction of Light at Plane Surfaces', version = version + 1 WHERE id = 'module-x-physics-refraction-tir';
UPDATE assignment_templates SET title = 'Refraction through a Lens' WHERE id = 'template-x-physics-lenses-spectrum-scattering';
UPDATE learning_modules SET title = 'Refraction through a Lens', version = version + 1 WHERE id = 'module-x-physics-lenses-spectrum-scattering';
UPDATE assignment_templates SET title = 'Sound' WHERE id = 'template-x-physics-sound';
UPDATE learning_modules SET title = 'Sound', version = version + 1 WHERE id = 'module-x-physics-sound';
UPDATE assignment_templates SET title = 'Current Electricity' WHERE id = 'template-x-physics-electricity';
UPDATE learning_modules SET title = 'Current Electricity', version = version + 1 WHERE id = 'module-x-physics-electricity';
UPDATE assignment_templates SET title = 'Electro-magnetism' WHERE id = 'template-x-physics-magnetism-induction';
UPDATE learning_modules SET title = 'Electro-magnetism', version = version + 1 WHERE id = 'module-x-physics-magnetism-induction';
UPDATE assignment_templates SET title = 'Calorimetry' WHERE id = 'template-x-physics-heat-calorimetry';
UPDATE learning_modules SET title = 'Calorimetry', version = version + 1 WHERE id = 'module-x-physics-heat-calorimetry';
UPDATE assignment_templates SET title = 'Radioactivity' WHERE id = 'template-x-physics-modern-physics';
UPDATE learning_modules SET title = 'Radioactivity', version = version + 1 WHERE id = 'module-x-physics-modern-physics';

UPDATE assignment_templates SET review_status = 'draft' WHERE class_level = 'X' AND subject = 'Physics';

UPDATE assignment_templates SET sequence = 1, review_status = 'reviewed'
WHERE id = 'template-x-physics-turning-forces';
UPDATE assignment_templates SET sequence = 2, review_status = 'reviewed'
WHERE id = 'template-x-physics-work-energy-power';
UPDATE assignment_templates SET sequence = 3, review_status = 'reviewed'
WHERE id = 'template-x-physics-machines-conservation-energy';
UPDATE assignment_templates SET sequence = 4, review_status = 'reviewed'
WHERE id = 'template-x-physics-refraction-tir';
UPDATE assignment_templates SET sequence = 5, review_status = 'reviewed'
WHERE id = 'template-x-physics-lenses-spectrum-scattering';
UPDATE assignment_templates SET sequence = 7, review_status = 'reviewed'
WHERE id = 'template-x-physics-sound';
UPDATE assignment_templates SET sequence = 8, review_status = 'reviewed'
WHERE id = 'template-x-physics-electricity';
UPDATE assignment_templates SET sequence = 10, review_status = 'reviewed'
WHERE id = 'template-x-physics-magnetism-induction';
UPDATE assignment_templates SET sequence = 11, review_status = 'reviewed'
WHERE id = 'template-x-physics-heat-calorimetry';
UPDATE assignment_templates SET sequence = 12, review_status = 'reviewed'
WHERE id = 'template-x-physics-modern-physics';

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
VALUES
  ('template-x-physics-spectrum', 'module-x-physics-spectrum', 'X', 'Physics', 'Spectrum', 'Read the lesson and worked example, answer every question, retain rough work where requested, and submit only when ready to review corrections.', 45, 'reviewed', 1, 1, 6),
  ('template-x-physics-household-circuits', 'module-x-physics-household-circuits', 'X', 'Physics', 'Household Circuits', 'Read the lesson and worked example, answer every question, retain rough work where requested, and submit only when ready to review corrections.', 50, 'reviewed', 1, 1, 9);

UPDATE questions SET topic_id = 'topic-x-physics-spectrum', version = version + 1 WHERE id IN ('x-physics-lens-q3', 'x-physics-lens-q4');

UPDATE questions SET topic_id = 'topic-x-physics-household-circuits', version = version + 1 WHERE id IN ('x-physics-elec-q2', 'x-physics-elec-q4', 'x-physics-elec-q5', 'x-physics-elec-q6');

DELETE FROM assignment_template_items
WHERE template_id IN ('template-x-physics-lenses-spectrum-scattering', 'template-x-physics-electricity',
                     'template-x-physics-spectrum', 'template-x-physics-household-circuits');

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
  ('template-x-physics-lenses-spectrum-scattering', 'x-physics-lens-q1', 0),
  ('template-x-physics-lenses-spectrum-scattering', 'x-physics-lens-q2', 1),
  ('template-x-physics-lenses-spectrum-scattering', 'x-physics-lens-q5', 2),
  ('template-x-physics-lenses-spectrum-scattering', 'x-physics-lens-q6', 3),
  ('template-x-physics-lenses-spectrum-scattering', 'x-physics-lens-q7', 4),
  ('template-x-physics-spectrum', 'x-physics-lens-q3', 0),
  ('template-x-physics-spectrum', 'x-physics-lens-q4', 1),
  ('template-x-physics-spectrum', 'x-physics-spectrum-q1', 2),
  ('template-x-physics-spectrum', 'x-physics-spectrum-q2', 3),
  ('template-x-physics-spectrum', 'x-physics-spectrum-q3', 4),
  ('template-x-physics-spectrum', 'x-physics-spectrum-q4', 5),
  ('template-x-physics-electricity', 'x-physics-elec-q1', 0),
  ('template-x-physics-electricity', 'x-physics-elec-q3', 1),
  ('template-x-physics-electricity', 'x-physics-elec-q7', 2),
  ('template-x-physics-electricity', 'x-physics-elec-q8', 3),
  ('template-x-physics-electricity', 'x-physics-elec-q9', 4),
  ('template-x-physics-electricity', 'x-physics-elec-q10', 5),
  ('template-x-physics-household-circuits', 'x-physics-elec-q2', 0),
  ('template-x-physics-household-circuits', 'x-physics-elec-q4', 1),
  ('template-x-physics-household-circuits', 'x-physics-elec-q5', 2),
  ('template-x-physics-household-circuits', 'x-physics-elec-q6', 3),
  ('template-x-physics-household-circuits', 'x-physics-household-q1', 4),
  ('template-x-physics-household-circuits', 'x-physics-household-q2', 5);

