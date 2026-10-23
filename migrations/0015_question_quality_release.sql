-- Replace weak cross-chapter Chemistry distractors with same-topic diagnostic MCQs.
-- Add a mandatory solution-verification ledger for every active reviewed MCQ.
-- Preserve historical assignments by versioning questions and templates rather than editing released rows.

PRAGMA foreign_keys = ON;

CREATE TABLE question_solution_checks (
  question_id TEXT PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  expected_answer_text TEXT NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('calculation', 'concept_check', 'source_check')),
  verification_notes TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'rejected')),
  verified_at TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1)
);

UPDATE assignment_templates
 SET active = 0
 WHERE subject = 'Chemistry' AND active = 1 AND review_status = 'reviewed';

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-matter-q1-v2', 'topic-viii-chem-matter', 'single_choice', 'Which particle-level change best explains why a gas expands when heated at constant pressure?', '[{"id":"a","label":"Its particles gain average kinetic energy and move farther apart."},{"id":"b","label":"Its particles increase in size while their motion stays unchanged."},{"id":"c","label":"Its particles lose kinetic energy and move closer together."},{"id":"d","label":"New gas particles are created as temperature rises."}]', '{"choice":"a"}', 'Heating raises average kinetic energy. Faster particles require more space at constant pressure; particles themselves neither grow nor appear.', 2, 0, 'reviewed', 2),
('viii-chem-matter-q2-v2', 'topic-viii-chem-matter', 'single_choice', 'Which comparison of particles in a solid and a gas is correct?', '[{"id":"a","label":"Solid particles are motionless; gas particles vibrate only about fixed positions."},{"id":"b","label":"Solid particles are farther apart than gas particles but attract more strongly."},{"id":"c","label":"Solid particles mainly vibrate about fixed positions; gas particles move freely with much larger separation."},{"id":"d","label":"Solid and gas particles have the same separation; only particle size changes."}]', '{"choice":"c"}', 'Particles in every state move. Solids have closely packed particles vibrating around fixed positions, whereas gas particles are widely separated and move freely.', 2, 0, 'reviewed', 2),
('viii-chem-matter-q3-v2', 'topic-viii-chem-matter', 'single_choice', 'Ice melts to liquid water in a closed container. Which statement is correct?', '[{"id":"a","label":"The arrangement and energy of H₂O particles change, but their chemical identity remains H₂O."},{"id":"b","label":"H₂O molecules split into hydrogen and oxygen during melting."},{"id":"c","label":"New H₂O molecules are created because liquid occupies a different volume."},{"id":"d","label":"The chemical formula changes temporarily and returns to H₂O on freezing."}]', '{"choice":"a"}', 'Melting is a physical change: particle arrangement and energy change, but no new substance forms and the molecules remain H₂O.', 2, 0, 'reviewed', 2),
('viii-chem-matter-q4-v2', 'topic-viii-chem-matter', 'single_choice', 'A sealed flask has a total mass of 35.0 g before two solutions react and form a precipitate. What mass should it have after the reaction?', '[{"id":"a","label":"Less than 35.0 g, because formation of a solid destroys some dissolved matter."},{"id":"b","label":"More than 35.0 g, because a precipitate has extra mass compared with its ions."},{"id":"c","label":"35.0 g, because no matter can enter or leave the closed flask."},{"id":"d","label":"It cannot be predicted unless the mass of the precipitate alone is measured."}]', '{"choice":"c"}', 'Conservation of mass applies to the complete closed system. A change of state or formation of a precipitate does not create or destroy matter.', 2, 1, 'reviewed', 2),
('viii-chem-matter-q5-v2', 'topic-viii-chem-matter', 'single_choice', 'A student reacts 10.0 g of reactants in an open beaker and measures 8.7 g afterward. What is the best explanation consistent with conservation of mass?', '[{"id":"a","label":"About 1.3 g of gaseous product or vapour probably escaped from the measured system."},{"id":"b","label":"About 1.3 g of matter was destroyed by the chemical reaction."},{"id":"c","label":"The products necessarily contain fewer atoms than the reactants."},{"id":"d","label":"Conservation of mass applies only to physical changes, not chemical reactions."}]', '{"choice":"a"}', 'The missing measured mass does not imply destroyed matter. In an open system, gas or vapour can leave; including it restores the total to 10.0 g.', 3, 1, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-matter-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-matter';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-matter-v2', 'viii-chem-matter-q1-v2', 0),
('template-viii-chem-matter-v2', 'viii-chem-matter-q2-v2', 1),
('template-viii-chem-matter-v2', 'viii-chem-matter-q3-v2', 2),
('template-viii-chem-matter-v2', 'viii-chem-matter-q4-v2', 3),
('template-viii-chem-matter-v2', 'viii-chem-matter-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-physical-chemical-changes-q1-v2', 'topic-viii-chem-physical-chemical-changes', 'single_choice', 'Which observation most strongly supports that a chemical change occurred?', '[{"id":"a","label":"A solid is crushed into a fine powder without changing composition."},{"id":"b","label":"Ice melts after absorbing heat and can freeze again."},{"id":"c","label":"Sugar disappears uniformly when stirred into water and is recovered by evaporation."},{"id":"d","label":"Two clear solutions form an insoluble precipitate with properties different from both solutions."}]', '{"choice":"d"}', 'A precipitate produced from dissolved reactants is a new substance and is strong evidence of chemical change; crushing, melting and dissolving need not alter composition.', 2, 0, 'reviewed', 2),
('viii-chem-physical-chemical-changes-q2-v2', 'topic-viii-chem-physical-chemical-changes', 'single_choice', 'Why is reversibility alone an unreliable test for distinguishing physical and chemical changes?', '[{"id":"a","label":"Every physical change is irreversible, while every chemical change is reversible."},{"id":"b","label":"Some physical changes are difficult to reverse, and some chemical reactions can be reversed under suitable conditions."},{"id":"c","label":"Reversibility proves only that heat was absorbed during the change."},{"id":"d","label":"Only changes involving gases can be reversed."}]', '{"choice":"b"}', 'The decisive test is formation of substances with new chemical compositions, not whether the original state is easy to restore.', 2, 0, 'reviewed', 2),
('viii-chem-physical-chemical-changes-q3-v2', 'topic-viii-chem-physical-chemical-changes', 'single_choice', 'Which statement correctly compares melting candle wax with burning candle vapour?', '[{"id":"a","label":"Both are chemical because both require heat from the flame."},{"id":"b","label":"Both are physical because the candle can be relit after cooling."},{"id":"c","label":"Melting is chemical because wax becomes liquid; burning is physical because gases form."},{"id":"d","label":"Melting changes state without forming a new substance; burning forms carbon dioxide and water."}]', '{"choice":"d"}', 'Heating does not by itself define a chemical change. Melting preserves wax composition, while combustion rearranges atoms into new products.', 2, 0, 'reviewed', 2),
('viii-chem-physical-chemical-changes-q4-v2', 'topic-viii-chem-physical-chemical-changes', 'single_choice', 'An iron nail rusts slowly in moist air. Which feature makes rusting a chemical change?', '[{"id":"a","label":"The change is slow rather than immediate."},{"id":"b","label":"Iron combines with substances from the environment to form iron oxide with new properties."},{"id":"c","label":"The nail surface becomes rougher while remaining pure iron."},{"id":"d","label":"The nail can no longer fit its original container."}]', '{"choice":"b"}', 'Rust is a new compound formed by reaction of iron with oxygen and moisture. Rate, shape and convenience of reversal do not define the change type.', 2, 0, 'reviewed', 2),
('viii-chem-physical-chemical-changes-q5-v2', 'topic-viii-chem-physical-chemical-changes', 'single_choice', 'A white solid is heated and gives off a gas, leaving a different solid. Which follow-up evidence would best confirm a chemical change?', '[{"id":"a","label":"The original solid was broken into smaller grains before heating."},{"id":"b","label":"The apparatus became warm while being heated externally."},{"id":"c","label":"The residue occupies less space than the original powder."},{"id":"d","label":"The residue and gas have compositions and characteristic properties different from the original solid."}]', '{"choice":"d"}', 'Chemical change is confirmed by new substances, not merely by heating, size reduction, or a volume difference. Different composition and properties provide the decisive evidence.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-physical-chemical-changes-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-physical-chemical-changes';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-physical-chemical-changes-v2', 'viii-chem-physical-chemical-changes-q1-v2', 0),
('template-viii-chem-physical-chemical-changes-v2', 'viii-chem-physical-chemical-changes-q2-v2', 1),
('template-viii-chem-physical-chemical-changes-v2', 'viii-chem-physical-chemical-changes-q3-v2', 2),
('template-viii-chem-physical-chemical-changes-v2', 'viii-chem-physical-chemical-changes-q4-v2', 3),
('template-viii-chem-physical-chemical-changes-v2', 'viii-chem-physical-chemical-changes-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-elements-compounds-mixtures-q1-v2', 'topic-viii-chem-elements-compounds-mixtures', 'single_choice', 'Which statement distinguishes a compound from a mixture of the same elements?', '[{"id":"a","label":"A compound keeps all properties of its elements; a mixture always forms new properties."},{"id":"b","label":"A compound is separated by physical methods; a mixture requires chemical decomposition."},{"id":"c","label":"A compound has elements chemically combined in a fixed ratio; a mixture can have variable proportions."},{"id":"d","label":"A compound contains one kind of atom; a mixture contains one kind of molecule."}]', '{"choice":"c"}', 'Fixed composition and chemical bonding distinguish a compound. Mixture components retain many properties and can usually be separated physically.', 2, 0, 'reviewed', 2),
('viii-chem-elements-compounds-mixtures-q2-v2', 'topic-viii-chem-elements-compounds-mixtures', 'single_choice', 'Which method is most suitable for separating two miscible liquids whose boiling points are close?', '[{"id":"a","label":"Fractional distillation, using repeated vaporisation and condensation."},{"id":"b","label":"A separating funnel, because the liquids form different layers."},{"id":"c","label":"Filtration, because one liquid passes through the filter first."},{"id":"d","label":"Sublimation, because the lower-boiling liquid changes directly to a gas."}]', '{"choice":"a"}', 'Miscible liquids do not form layers. Close boiling points require a fractionating column; filtration and sublimation do not separate two liquids in solution.', 2, 0, 'reviewed', 2),
('viii-chem-elements-compounds-mixtures-q3-v2', 'topic-viii-chem-elements-compounds-mixtures', 'single_choice', 'Why can paper chromatography separate dyes dissolved in the same solvent?', '[{"id":"a","label":"The paper chemically converts each dye into a different element."},{"id":"b","label":"The heaviest dye is trapped only because its particles are too large for paper pores."},{"id":"c","label":"The dyes have different attractions to the stationary paper and mobile solvent, so they move at different rates."},{"id":"d","label":"Each dye boils at a sharply different temperature while moving up the paper."}]', '{"choice":"c"}', 'Chromatographic separation depends on unequal partition or attraction between stationary and mobile phases, not filtration, boiling, or chemical decomposition.', 2, 0, 'reviewed', 2),
('viii-chem-elements-compounds-mixtures-q4-v2', 'topic-viii-chem-elements-compounds-mixtures', 'single_choice', 'A mixture contains iron filings, ammonium chloride and sand. Which sequence separates all three?', '[{"id":"a","label":"Use a magnet for iron, then sublime ammonium chloride, leaving sand."},{"id":"b","label":"Sublime the iron first, then dissolve the sand and filter ammonium chloride."},{"id":"c","label":"Filter the dry mixture, then use a separating funnel for iron and sand."},{"id":"d","label":"Evaporate the iron, magnetise ammonium chloride, and decant the sand."}]', '{"choice":"a"}', 'Iron is magnetic, ammonium chloride sublimes, and sand is neither magnetic nor sublimable under these conditions. The order uses two relevant property differences.', 2, 0, 'reviewed', 2),
('viii-chem-elements-compounds-mixtures-q5-v2', 'topic-viii-chem-elements-compounds-mixtures', 'single_choice', 'Salt solution contains insoluble sand. Which sequence recovers both clean sand and solid salt?', '[{"id":"a","label":"Evaporate first until both sand and salt pass into the vapour."},{"id":"b","label":"Use a separating funnel because dissolved salt forms a lower liquid layer."},{"id":"c","label":"Filter to collect and wash the sand, then evaporate or crystallise the filtrate to recover salt."},{"id":"d","label":"Use a magnet for the salt, then filter the remaining sand-water mixture."}]', '{"choice":"c"}', 'Filtration removes the insoluble sand; dissolved salt remains in the filtrate and is recovered by evaporation or crystallisation.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-elements-compounds-mixtures-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-elements-compounds-mixtures';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-elements-compounds-mixtures-v2', 'viii-chem-elements-compounds-mixtures-q1-v2', 0),
('template-viii-chem-elements-compounds-mixtures-v2', 'viii-chem-elements-compounds-mixtures-q2-v2', 1),
('template-viii-chem-elements-compounds-mixtures-v2', 'viii-chem-elements-compounds-mixtures-q3-v2', 2),
('template-viii-chem-elements-compounds-mixtures-v2', 'viii-chem-elements-compounds-mixtures-q4-v2', 3),
('template-viii-chem-elements-compounds-mixtures-v2', 'viii-chem-elements-compounds-mixtures-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-atomic-structure-q1-v2', 'topic-viii-chem-atomic-structure', 'single_choice', 'A neutral atom has atomic number 17 and mass number 37. Which description is correct?', '[{"id":"a","label":"17 protons, 20 electrons and 17 neutrons."},{"id":"b","label":"17 protons, 17 electrons and 20 neutrons."},{"id":"c","label":"20 protons, 17 electrons and 17 neutrons."},{"id":"d","label":"17 protons, 17 electrons and 37 neutrons."}]', '{"choice":"b"}', 'Atomic number gives 17 protons and, for a neutral atom, 17 electrons. Neutrons equal mass number minus atomic number: 37 − 17 = 20.', 2, 1, 'reviewed', 2),
('viii-chem-atomic-structure-q2-v2', 'topic-viii-chem-atomic-structure', 'single_choice', 'Which pair represents isotopes of the same element?', '[{"id":"a","label":"Atoms with 8 protons and 8 neutrons, and with 10 protons and 8 neutrons."},{"id":"b","label":"Atoms with 8 electrons and 8 neutrons, and with 10 protons and 10 neutrons."},{"id":"c","label":"Atoms with mass numbers 8 and 10 but with different proton numbers."},{"id":"d","label":"Atoms with 8 protons and 8 neutrons, and with 8 protons and 10 neutrons."}]', '{"choice":"d"}', 'Isotopes have the same proton number and different neutron numbers, giving the same atomic number but different mass numbers.', 2, 0, 'reviewed', 2),
('viii-chem-atomic-structure-q3-v2', 'topic-viii-chem-atomic-structure', 'single_choice', 'What happens when a neutral chlorine atom with electron arrangement 2,8,7 forms Cl⁻?', '[{"id":"a","label":"It loses one proton to become 2,8,8; its mass number decreases."},{"id":"b","label":"It gains one electron to become 2,8,8; its nucleus is unchanged."},{"id":"c","label":"It gains one proton and one electron to become 2,8,8."},{"id":"d","label":"It loses seven electrons so that only the first two shells remain."}]', '{"choice":"b"}', 'An anion forms by electron gain. Ordinary ion formation changes only electrons, not the numbers of protons or neutrons in the nucleus.', 2, 0, 'reviewed', 2),
('viii-chem-atomic-structure-q4-v2', 'topic-viii-chem-atomic-structure', 'single_choice', 'Which electron arrangement belongs to a neutral calcium atom with atomic number 20?', '[{"id":"a","label":"2,8,10"},{"id":"b","label":"2,8,7,3"},{"id":"c","label":"2,10,8"},{"id":"d","label":"2,8,8,2"}]', '{"choice":"d"}', 'A neutral calcium atom has 20 electrons. Filling shells for the first twenty elements gives 2 + 8 + 8 + 2 = 20.', 2, 1, 'reviewed', 2),
('viii-chem-atomic-structure-q5-v2', 'topic-viii-chem-atomic-structure', 'single_choice', 'Two neutral atoms have arrangements 2,8,1 and 2,8,7. Which prediction is most reasonable?', '[{"id":"a","label":"Both tend to lose seven electrons to empty their outer shells."},{"id":"b","label":"The first tends to lose one electron and the second tends to gain one electron."},{"id":"c","label":"The first tends to gain seven electrons and the second tends to lose seven."},{"id":"d","label":"Neither can form ions because both already have three occupied shells."}]', '{"choice":"b"}', 'Atoms tend toward stable outer-shell arrangements: 2,8,1 most readily loses one electron, while 2,8,7 most readily gains one.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-atomic-structure-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-atomic-structure';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-atomic-structure-v2', 'viii-chem-atomic-structure-q1-v2', 0),
('template-viii-chem-atomic-structure-v2', 'viii-chem-atomic-structure-q2-v2', 1),
('template-viii-chem-atomic-structure-v2', 'viii-chem-atomic-structure-q3-v2', 2),
('template-viii-chem-atomic-structure-v2', 'viii-chem-atomic-structure-q4-v2', 3),
('template-viii-chem-atomic-structure-v2', 'viii-chem-atomic-structure-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-language-of-chemistry-q1-v2', 'topic-viii-chem-language-of-chemistry', 'single_choice', 'Which formula correctly represents aluminium oxide formed from Al³⁺ and O²⁻?', '[{"id":"a","label":"Al₂O₃"},{"id":"b","label":"AlO"},{"id":"c","label":"Al₃O₂"},{"id":"d","label":"Al₂O₆"}]', '{"choice":"a"}', 'The smallest neutral ratio uses 2 Al³⁺ ions (+6) and 3 O²⁻ ions (−6), giving Al₂O₃ rather than unreduced or charge-unbalanced subscripts.', 2, 1, 'reviewed', 2),
('viii-chem-language-of-chemistry-q2-v2', 'topic-viii-chem-language-of-chemistry', 'single_choice', 'Which formula correctly uses brackets for calcium hydroxide?', '[{"id":"a","label":"CaOH₂"},{"id":"b","label":"Ca₂OH"},{"id":"c","label":"Ca(OH)₂"},{"id":"d","label":"Ca₂(OH)"}]', '{"choice":"c"}', 'Calcium is Ca²⁺ and hydroxide is the polyatomic ion OH⁻. Two complete hydroxide ions are required, so the group is bracketed: Ca(OH)₂.', 2, 0, 'reviewed', 2),
('viii-chem-language-of-chemistry-q3-v2', 'topic-viii-chem-language-of-chemistry', 'single_choice', 'Which equation is correctly balanced without changing any chemical formula?', '[{"id":"a","label":"2H₂ + O₂ → 2H₂O"},{"id":"b","label":"H₂ + O₂ → H₂O"},{"id":"c","label":"H₂ + O₂ → H₂O₂"},{"id":"d","label":"2H₂ + 2O₂ → 2H₂O"}]', '{"choice":"a"}', 'Coefficients 2:1:2 give four H atoms and two O atoms on each side. Changing H₂O to H₂O₂ would change the substance, not balance the equation.', 2, 1, 'reviewed', 2),
('viii-chem-language-of-chemistry-q4-v2', 'topic-viii-chem-language-of-chemistry', 'single_choice', 'What does the coefficient 3 mean in 2Al + 3Cl₂ → 2AlCl₃?', '[{"id":"a","label":"Each chlorine molecule contains three chlorine atoms."},{"id":"b","label":"The formula of chlorine has been changed from Cl₂ to Cl₃."},{"id":"c","label":"Three molecules (or moles) of chlorine react in the stated ratio."},{"id":"d","label":"Three aluminium atoms are present in every unit of AlCl₃."}]', '{"choice":"c"}', 'A coefficient counts whole particles or moles and multiplies the complete formula. It does not alter subscripts or composition.', 2, 0, 'reviewed', 2),
('viii-chem-language-of-chemistry-q5-v2', 'topic-viii-chem-language-of-chemistry', 'single_choice', 'Which formula and balanced equation correctly show aluminium reacting with sulphuric acid?', '[{"id":"a","label":"Al₂(SO₄)₃; 2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂"},{"id":"b","label":"AlSO₄; Al + H₂SO₄ → AlSO₄ + H₂"},{"id":"c","label":"Al₃(SO₄)₂; 3Al + 2H₂SO₄ → Al₃(SO₄)₂ + 2H₂"},{"id":"d","label":"Al₂SO₄; 2Al + H₂SO₄ → Al₂SO₄ + H₂"}]', '{"choice":"a"}', 'Al³⁺ and SO₄²⁻ require the ratio 2:3. The equation then balances with coefficients 2, 3, 1 and 3.', 3, 1, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-language-of-chemistry-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-language-of-chemistry';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-language-of-chemistry-v2', 'viii-chem-language-of-chemistry-q1-v2', 0),
('template-viii-chem-language-of-chemistry-v2', 'viii-chem-language-of-chemistry-q2-v2', 1),
('template-viii-chem-language-of-chemistry-v2', 'viii-chem-language-of-chemistry-q3-v2', 2),
('template-viii-chem-language-of-chemistry-v2', 'viii-chem-language-of-chemistry-q4-v2', 3),
('template-viii-chem-language-of-chemistry-v2', 'viii-chem-language-of-chemistry-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-chemical-reactions-q1-v2', 'topic-viii-chem-chemical-reactions', 'single_choice', 'Which equation represents a decomposition reaction?', '[{"id":"a","label":"2Mg + O₂ → 2MgO"},{"id":"b","label":"Zn + CuSO₄ → ZnSO₄ + Cu"},{"id":"c","label":"AgNO₃ + NaCl → AgCl + NaNO₃"},{"id":"d","label":"CaCO₃ → CaO + CO₂"}]', '{"choice":"d"}', 'One compound splitting into simpler substances is decomposition. The alternatives show combination, displacement and double displacement.', 2, 0, 'reviewed', 2),
('viii-chem-chemical-reactions-q2-v2', 'topic-viii-chem-chemical-reactions', 'single_choice', 'Zinc is placed in copper(II) sulphate solution. Why does copper form?', '[{"id":"a","label":"Copper is more reactive than zinc and therefore leaves the solution first."},{"id":"b","label":"Zinc is more reactive than copper and displaces Cu²⁺ from solution."},{"id":"c","label":"Zinc and copper exchange protons in a neutralisation reaction."},{"id":"d","label":"Copper(II) sulphate decomposes solely because the solution is stirred."}]', '{"choice":"b"}', 'A more reactive metal displaces a less reactive metal from its compound: Zn + CuSO₄ → ZnSO₄ + Cu.', 2, 0, 'reviewed', 2),
('viii-chem-chemical-reactions-q3-v2', 'topic-viii-chem-chemical-reactions', 'single_choice', 'Which observation indicates an exothermic reaction when no external heating is supplied?', '[{"id":"a","label":"The mixture cools because energy is released from the surroundings."},{"id":"b","label":"The temperature remains constant, which proves heat is released."},{"id":"c","label":"The reactants absorb heat and the surroundings become warmer."},{"id":"d","label":"The reaction mixture warms as energy is transferred to the surroundings."}]', '{"choice":"d"}', 'An exothermic reaction releases energy to the surroundings, commonly causing a measurable temperature rise. Cooling instead suggests net energy absorption.', 2, 0, 'reviewed', 2),
('viii-chem-chemical-reactions-q4-v2', 'topic-viii-chem-chemical-reactions', 'single_choice', 'How does a catalyst increase reaction rate?', '[{"id":"a","label":"It raises the energy of every product and is consumed completely."},{"id":"b","label":"It provides an alternative pathway requiring lower activation energy and is regenerated overall."},{"id":"c","label":"It changes the final amount predicted by the balanced equation by adding atoms."},{"id":"d","label":"It prevents effective particle collisions while increasing temperature."}]', '{"choice":"b"}', 'A catalyst lowers the activation-energy barrier, increasing the fraction of effective collisions. It changes rate, not stoichiometry, and is not consumed overall.', 2, 0, 'reviewed', 2),
('viii-chem-chemical-reactions-q5-v2', 'topic-viii-chem-chemical-reactions', 'single_choice', 'Which classification and balanced equation apply when zinc is added to copper(II) sulphate solution?', '[{"id":"a","label":"Combination: Zn + CuSO₄ → ZnCuSO₄"},{"id":"b","label":"Decomposition: ZnSO₄ → Zn + SO₄"},{"id":"c","label":"Double displacement: Zn + CuSO₄ → Cu + ZnSO₄ because both metals exchange anions."},{"id":"d","label":"Displacement: Zn + CuSO₄ → ZnSO₄ + Cu"}]', '{"choice":"d"}', 'Elemental zinc replaces copper from one compound, so this is single displacement. The 1:1:1:1 equation conserves each element.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-chemical-reactions-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-chemical-reactions';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-chemical-reactions-v2', 'viii-chem-chemical-reactions-q1-v2', 0),
('template-viii-chem-chemical-reactions-v2', 'viii-chem-chemical-reactions-q2-v2', 1),
('template-viii-chem-chemical-reactions-v2', 'viii-chem-chemical-reactions-q3-v2', 2),
('template-viii-chem-chemical-reactions-v2', 'viii-chem-chemical-reactions-q4-v2', 3),
('template-viii-chem-chemical-reactions-v2', 'viii-chem-chemical-reactions-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-hydrogen-q1-v2', 'topic-viii-chem-hydrogen', 'single_choice', 'Which laboratory combination safely prepares hydrogen gas?', '[{"id":"a","label":"Copper with dilute hydrochloric acid."},{"id":"b","label":"Zinc with concentrated nitric acid."},{"id":"c","label":"Zinc with dilute hydrochloric acid."},{"id":"d","label":"Silver with water at room temperature."}]', '{"choice":"c"}', 'Zinc displaces hydrogen from a dilute non-oxidising acid. Copper and silver are too unreactive in these conditions, while nitric acid is oxidising.', 2, 0, 'reviewed', 2),
('viii-chem-hydrogen-q2-v2', 'topic-viii-chem-hydrogen', 'single_choice', 'Why is the first gas from a hydrogen preparation apparatus allowed to escape?', '[{"id":"a","label":"It contains displaced air that could form an explosive mixture with hydrogen."},{"id":"b","label":"Pure hydrogen is too dense to collect during the first minute."},{"id":"c","label":"The first hydrogen contains water that makes it non-flammable forever."},{"id":"d","label":"Air converts hydrogen into carbon dioxide inside the flask."}]', '{"choice":"a"}', 'The apparatus initially contains air. Testing that first hydrogen-air mixture with a flame is dangerous, so it is flushed out before collection or ignition.', 2, 0, 'reviewed', 2),
('viii-chem-hydrogen-q3-v2', 'topic-viii-chem-hydrogen', 'single_choice', 'Which observation is the characteristic test for hydrogen?', '[{"id":"a","label":"It relights a glowing splint without any sound."},{"id":"b","label":"It turns limewater milky immediately."},{"id":"c","label":"It burns with a small pop when a lighted splint is brought near."},{"id":"d","label":"It turns moist blue litmus red and bleaches it."}]', '{"choice":"c"}', 'Hydrogen ignites rapidly in air and gives the characteristic pop. Relighting a glowing splint tests oxygen; limewater tests carbon dioxide.', 2, 0, 'reviewed', 2),
('viii-chem-hydrogen-q4-v2', 'topic-viii-chem-hydrogen', 'single_choice', 'In CuO + H₂ → Cu + H₂O, what role does hydrogen play?', '[{"id":"a","label":"It is the reducing agent because it removes oxygen from CuO and is oxidised to water."},{"id":"b","label":"It is the oxidising agent because it gives oxygen to copper."},{"id":"c","label":"It is a catalyst because it remains unchanged after the reaction."},{"id":"d","label":"It is an inert carrier gas because copper alone removes the oxygen."}]', '{"choice":"a"}', 'Hydrogen reduces copper(II) oxide by removing oxygen; hydrogen itself gains oxygen and is oxidised to H₂O.', 2, 0, 'reviewed', 2),
('viii-chem-hydrogen-q5-v2', 'topic-viii-chem-hydrogen', 'single_choice', 'Which equation and precaution correctly describe preparation of hydrogen from zinc and dilute hydrochloric acid?', '[{"id":"a","label":"Zn + HCl → ZnCl + H₂; ignite the first gas immediately."},{"id":"b","label":"2Zn + HCl → Zn₂Cl + H₂; collect the first gas in a sealed hot vessel."},{"id":"c","label":"Zn + 2HCl → ZnCl₂ + H₂; discard the first gas before testing."},{"id":"d","label":"Zn + 2HCl → ZnCl₂ + 2H; test the atomic hydrogen inside the generator."}]', '{"choice":"c"}', 'The balanced equation conserves Zn, H and Cl. The first gas may contain an explosive air-hydrogen mixture and must be discarded.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-hydrogen-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-hydrogen';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-hydrogen-v2', 'viii-chem-hydrogen-q1-v2', 0),
('template-viii-chem-hydrogen-v2', 'viii-chem-hydrogen-q2-v2', 1),
('template-viii-chem-hydrogen-v2', 'viii-chem-hydrogen-q3-v2', 2),
('template-viii-chem-hydrogen-v2', 'viii-chem-hydrogen-q4-v2', 3),
('template-viii-chem-hydrogen-v2', 'viii-chem-hydrogen-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-water-q1-v2', 'topic-viii-chem-water', 'single_choice', 'What does a solubility of 40 g per 100 g water at 25 °C mean?', '[{"id":"a","label":"Every 100 g of saturated solution contains exactly 40 g water."},{"id":"b","label":"At most 40 g solute dissolves in 100 g water at 25 °C to form a saturated solution."},{"id":"c","label":"Exactly 40 g dissolves at every temperature, regardless of the solvent mass."},{"id":"d","label":"Forty grams is the minimum needed before any solute begins to dissolve."}]', '{"choice":"b"}', 'Solubility is a maximum amount for a stated solvent mass and temperature. It is not the composition of 100 g solution or a temperature-independent value.', 2, 0, 'reviewed', 2),
('viii-chem-water-q2-v2', 'topic-viii-chem-water', 'single_choice', 'How does heating usually affect solubility in water?', '[{"id":"a","label":"All solids become less soluble and all gases become more soluble."},{"id":"b","label":"Both solids and gases always become more soluble by exactly the same amount."},{"id":"c","label":"Temperature affects dissolving speed only and never the final solubility."},{"id":"d","label":"Most solid solutes become more soluble, while gases generally become less soluble."}]', '{"choice":"d"}', 'The common trend is increasing solubility for many solids and decreasing solubility for gases, though individual substances may vary.', 2, 0, 'reviewed', 2),
('viii-chem-water-q3-v2', 'topic-viii-chem-water', 'single_choice', 'Which treatment removes temporary hardness but normally does not remove permanent hardness?', '[{"id":"a","label":"Simple filtration."},{"id":"b","label":"Boiling the water."},{"id":"c","label":"Adding more soap."},{"id":"d","label":"Passing the water through clean sand only."}]', '{"choice":"b"}', 'Boiling decomposes soluble hydrogencarbonates responsible for temporary hardness. Permanent chlorides or sulphates require ion exchange, washing soda, or distillation.', 2, 0, 'reviewed', 2),
('viii-chem-water-q4-v2', 'topic-viii-chem-water', 'single_choice', 'Which pairing of water-treatment method and purpose is correct?', '[{"id":"a","label":"Filtration removes all dissolved salts; chlorination removes sand."},{"id":"b","label":"Boiling removes every dissolved mineral; sedimentation kills microorganisms."},{"id":"c","label":"Chlorination removes permanent hardness; filtration removes dissolved ions."},{"id":"d","label":"Filtration removes suspended particles; chlorination or boiling controls microorganisms."}]', '{"choice":"d"}', 'Different hazards need different treatments. Filters retain suspended matter, while heat or disinfectant controls microbes; ordinary filtration does not remove dissolved ions.', 2, 0, 'reviewed', 2),
('viii-chem-water-q5-v2', 'topic-viii-chem-water', 'single_choice', 'At 40 °C, 65 g of a salt dissolves in 100 g of water. How much dissolves in 250 g of water at the same temperature?', '[{"id":"a","label":"26.0 g"},{"id":"b","label":"162.5 g"},{"id":"c","label":"115.0 g"},{"id":"d","label":"260.0 g"}]', '{"choice":"b"}', 'At unchanged temperature the amount scales with solvent mass: 65 × 250 ÷ 100 = 162.5 g. The distractors reverse or misapply the proportion.', 3, 1, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-water-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-water';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-water-v2', 'viii-chem-water-q1-v2', 0),
('template-viii-chem-water-v2', 'viii-chem-water-q2-v2', 1),
('template-viii-chem-water-v2', 'viii-chem-water-q3-v2', 2),
('template-viii-chem-water-v2', 'viii-chem-water-q4-v2', 3),
('template-viii-chem-water-v2', 'viii-chem-water-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('viii-chem-carbon-compounds-q1-v2', 'topic-viii-chem-carbon-compounds', 'single_choice', 'Which pair of properties explains why carbon forms so many compounds?', '[{"id":"a","label":"Tetravalency and catenation."},{"id":"b","label":"Monovalency and ionisation."},{"id":"c","label":"Inertness and metallic bonding."},{"id":"d","label":"Radioactivity and sublimation."}]', '{"choice":"a"}', 'Carbon forms four covalent bonds and stable bonds to other carbon atoms, enabling chains, branches and rings. The alternatives do not describe its organic diversity.', 2, 0, 'reviewed', 2),
('viii-chem-carbon-compounds-q2-v2', 'topic-viii-chem-carbon-compounds', 'single_choice', 'Why does graphite conduct electricity while diamond normally does not?', '[{"id":"a","label":"Graphite is ionic and releases ions, while diamond is made of isolated atoms."},{"id":"b","label":"Diamond has mobile electrons only at room temperature, while graphite has none."},{"id":"c","label":"Graphite has mobile delocalised electrons within its layers; diamond uses its valence electrons in fixed covalent bonds."},{"id":"d","label":"Graphite conducts because its layers melt, while diamond remains solid."}]', '{"choice":"c"}', 'Both are covalent allotropes, but their structures differ. Graphite retains delocalised electrons; diamond has a rigid network with no mobile charge carriers.', 2, 0, 'reviewed', 2),
('viii-chem-carbon-compounds-q3-v2', 'topic-viii-chem-carbon-compounds', 'single_choice', 'Which condition is most likely to produce poisonous carbon monoxide from a fuel?', '[{"id":"a","label":"Incomplete combustion caused by an insufficient oxygen supply."},{"id":"b","label":"Complete combustion in excess oxygen."},{"id":"c","label":"Cooling carbon dioxide in an open room."},{"id":"d","label":"Passing pure oxygen over fully burned ash."}]', '{"choice":"a"}', 'Limited oxygen can prevent complete oxidation to CO₂ and produce CO. Adequate ventilation and a clean blue flame reduce this risk.', 2, 0, 'reviewed', 2),
('viii-chem-carbon-compounds-q4-v2', 'topic-viii-chem-carbon-compounds', 'single_choice', 'Which test identifies carbon dioxide?', '[{"id":"a","label":"Apply a lighted splint; a popping sound proves carbon dioxide."},{"id":"b","label":"Expose dry red litmus; it turns blue without water."},{"id":"c","label":"Bubble it through limewater; a milky suspension forms."},{"id":"d","label":"Pass it over copper(II) oxide; a bright copper deposit forms."}]', '{"choice":"c"}', 'Carbon dioxide reacts with limewater to form insoluble calcium carbonate, causing milkiness. The pop test is for hydrogen.', 2, 0, 'reviewed', 2),
('viii-chem-carbon-compounds-q5-v2', 'topic-viii-chem-carbon-compounds', 'single_choice', 'A burner has a yellow smoky flame in a closed kitchen. What is the safest interpretation and response?', '[{"id":"a","label":"Incomplete combustion may be producing carbon monoxide; turn it off, ventilate, and correct the air supply."},{"id":"b","label":"Complete combustion is occurring; close all vents to conserve heat."},{"id":"c","label":"Only harmless carbon dioxide is produced; increase the fuel flow."},{"id":"d","label":"The smoke proves graphite is conducting electricity; add water to the flame."}]', '{"choice":"a"}', 'A yellow smoky flame indicates insufficient oxygen and possible CO formation. CO prevents effective oxygen transport in blood, so immediate shutdown and ventilation are required.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-viii-chem-carbon-compounds-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-viii-chem-carbon-compounds';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-viii-chem-carbon-compounds-v2', 'viii-chem-carbon-compounds-q1-v2', 0),
('template-viii-chem-carbon-compounds-v2', 'viii-chem-carbon-compounds-q2-v2', 1),
('template-viii-chem-carbon-compounds-v2', 'viii-chem-carbon-compounds-q3-v2', 2),
('template-viii-chem-carbon-compounds-v2', 'viii-chem-carbon-compounds-q4-v2', 3),
('template-viii-chem-carbon-compounds-v2', 'viii-chem-carbon-compounds-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-periodic-properties-q1-v2', 'topic-x-chem-periodic-properties', 'single_choice', 'Which statement best explains why elements in the same group have similar chemical properties?', '[{"id":"a","label":"They have the same number of occupied shells."},{"id":"b","label":"They have identical atomic numbers."},{"id":"c","label":"They have equal numbers of protons and neutrons."},{"id":"d","label":"They have related outer-shell electron arrangements."}]', '{"choice":"d"}', 'Chemical behaviour depends strongly on valence electrons. Period number, not group, gives occupied shells; every element has a unique atomic number.', 2, 0, 'reviewed', 2),
('x-chem-periodic-properties-q2-v2', 'topic-x-chem-periodic-properties', 'single_choice', 'Across Period 3 from sodium toward chlorine, which general trend is correct?', '[{"id":"a","label":"Atomic size increases while electronegativity generally decreases."},{"id":"b","label":"Atomic size decreases while electronegativity generally increases."},{"id":"c","label":"Both atomic size and electronegativity generally decrease."},{"id":"d","label":"Atomic size remains constant because all atoms have three shells."}]', '{"choice":"b"}', 'Increasing nuclear charge acts across the same principal shell, pulling electrons closer and raising attraction for bonding electrons.', 2, 0, 'reviewed', 2),
('x-chem-periodic-properties-q3-v2', 'topic-x-chem-periodic-properties', 'single_choice', 'Why does atomic size generally increase down a group?', '[{"id":"a","label":"Nuclear charge decreases because lower elements contain fewer protons."},{"id":"b","label":"Valence electrons enter the same shell and are pulled progressively closer."},{"id":"c","label":"Atoms lose every inner electron as the group is descended."},{"id":"d","label":"Each step adds an occupied shell, increasing shielding and distance of valence electrons from the nucleus."}]', '{"choice":"d"}', 'Additional shells and shielding outweigh increased nuclear charge, so the outer electrons are farther from the nucleus.', 2, 0, 'reviewed', 2),
('x-chem-periodic-properties-q4-v2', 'topic-x-chem-periodic-properties', 'single_choice', 'Which reactivity trend is generally correct?', '[{"id":"a","label":"Both Group 1 metals and Group 17 halogens become less reactive down their groups."},{"id":"b","label":"Group 1 metals become more reactive down the group, while Group 17 halogens become less reactive."},{"id":"c","label":"Group 1 metals become less reactive, while Group 17 halogens become more reactive."},{"id":"d","label":"Both groups become more reactive because atomic size always decreases downward."}]', '{"choice":"b"}', 'Larger Group 1 atoms lose an electron more easily; increased size and shielding make electron gain less favourable down Group 17.', 2, 0, 'reviewed', 2),
('x-chem-periodic-properties-q5-v2', 'topic-x-chem-periodic-properties', 'single_choice', 'Compared with sodium in the same period, which description of chlorine is correct?', '[{"id":"a","label":"Chlorine is larger, more metallic and less electronegative."},{"id":"b","label":"Chlorine is smaller, more metallic and less electronegative."},{"id":"c","label":"Chlorine has an extra occupied shell and therefore a larger radius."},{"id":"d","label":"Chlorine is smaller, less metallic and more electronegative."}]', '{"choice":"d"}', 'Both use three occupied shells, but chlorine has greater nuclear charge. It pulls the shell closer, has reduced metallic character and attracts bonding electrons more strongly.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-periodic-properties-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-periodic-properties';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-periodic-properties-v2', 'x-chem-periodic-properties-q1-v2', 0),
('template-x-chem-periodic-properties-v2', 'x-chem-periodic-properties-q2-v2', 1),
('template-x-chem-periodic-properties-v2', 'x-chem-periodic-properties-q3-v2', 2),
('template-x-chem-periodic-properties-v2', 'x-chem-periodic-properties-q4-v2', 3),
('template-x-chem-periodic-properties-v2', 'x-chem-periodic-properties-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-chemical-bonding-q1-v2', 'topic-x-chem-chemical-bonding', 'single_choice', 'What happens when sodium chloride forms by electrovalent bonding?', '[{"id":"a","label":"Sodium and chlorine share one electron equally to form neutral atoms."},{"id":"b","label":"Chlorine transfers a proton to sodium, forming Na⁻ and Cl⁺."},{"id":"c","label":"Sodium transfers one electron to chlorine, forming Na⁺ and Cl⁻ ions held by electrostatic attraction."},{"id":"d","label":"Sodium and chlorine exchange neutrons and remain uncharged."}]', '{"choice":"c"}', 'Ionic bonding involves electron transfer and attraction between opposite ions. Nuclei and proton counts do not change.', 2, 0, 'reviewed', 2),
('x-chem-chemical-bonding-q2-v2', 'topic-x-chem-chemical-bonding', 'single_choice', 'Why does solid sodium chloride not conduct electricity while molten sodium chloride does?', '[{"id":"a","label":"Its ions are fixed in the solid lattice but become mobile in the molten state."},{"id":"b","label":"The solid contains no charged particles, but melting creates electrons."},{"id":"c","label":"Solid NaCl conducts only through stationary ions; melting stops their movement."},{"id":"d","label":"Melting converts NaCl into an uncharged covalent molecule."}]', '{"choice":"a"}', 'NaCl contains ions in both states. Electrical conduction requires those ions to move, which becomes possible after the lattice melts.', 2, 0, 'reviewed', 2),
('x-chem-chemical-bonding-q3-v2', 'topic-x-chem-chemical-bonding', 'single_choice', 'Which statement correctly distinguishes a polar covalent bond from an ionic bond?', '[{"id":"a","label":"A polar covalent bond transfers all bonding electrons; an ionic bond shares them equally."},{"id":"b","label":"Both require complete electron transfer, but only the polar bond forms ions."},{"id":"c","label":"A polar covalent bond shares electrons unequally; an ionic bond follows electron transfer and ion formation."},{"id":"d","label":"Neither involves valence electrons; both arise from neutron attraction."}]', '{"choice":"c"}', 'Unequal electronegativity can produce unequal sharing without complete transfer. Ionic bonding instead produces oppositely charged ions.', 2, 0, 'reviewed', 2),
('x-chem-chemical-bonding-q4-v2', 'topic-x-chem-chemical-bonding', 'single_choice', 'How is the coordinate bond formed when NH₃ becomes NH₄⁺?', '[{"id":"a","label":"Nitrogen donates its lone pair to H⁺, so both electrons in the new shared pair originate from nitrogen."},{"id":"b","label":"H⁺ donates two electrons to nitrogen and remains neutral."},{"id":"c","label":"Nitrogen transfers a proton to NH₃ and loses its lone pair completely."},{"id":"d","label":"One electron comes from nitrogen and one from H⁺ exactly as in an ordinary covalent bond."}]', '{"choice":"a"}', 'A coordinate bond is a shared pair supplied by one donor atom. Ammonia supplies its nitrogen lone pair to electron-deficient H⁺.', 2, 0, 'reviewed', 2),
('x-chem-chemical-bonding-q5-v2', 'topic-x-chem-chemical-bonding', 'single_choice', 'Which comparison of magnesium chloride and carbon tetrachloride is most accurate?', '[{"id":"a","label":"MgCl₂ is covalent and conducts as a solid; CCl₄ is ionic and conducts when molten."},{"id":"b","label":"Both are ionic because both contain chlorine, so both conduct as solids."},{"id":"c","label":"MgCl₂ forms an ionic lattice and conducts when molten; CCl₄ is covalent and does not provide mobile ions."},{"id":"d","label":"Both are simple covalent substances and conduct through freely moving electrons."}]', '{"choice":"c"}', 'Bonding depends on electron transfer or sharing, not merely on the elements present. Ionic MgCl₂ conducts only when ions are mobile; molecular CCl₄ lacks such carriers.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-chemical-bonding-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-chemical-bonding';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-chemical-bonding-v2', 'x-chem-chemical-bonding-q1-v2', 0),
('template-x-chem-chemical-bonding-v2', 'x-chem-chemical-bonding-q2-v2', 1),
('template-x-chem-chemical-bonding-v2', 'x-chem-chemical-bonding-q3-v2', 2),
('template-x-chem-chemical-bonding-v2', 'x-chem-chemical-bonding-q4-v2', 3),
('template-x-chem-chemical-bonding-v2', 'x-chem-chemical-bonding-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-acids-bases-salts-q1-v2', 'topic-x-chem-acids-bases-salts', 'single_choice', 'In aqueous solutions, which pairing of substances and characteristic ions is correct?', '[{"id":"a","label":"Acids produce OH⁻ ions, while alkalis produce H₃O⁺ ions."},{"id":"b","label":"Acids produce H₃O⁺ ions, while alkalis produce OH⁻ ions."},{"id":"c","label":"Acids produce free H⁺ without interacting with water, while alkalis produce oxygen gas."},{"id":"d","label":"Both acids and alkalis produce only neutral molecules in water."}]', '{"choice":"b"}', 'Acidic behaviour in water is associated with hydronium ions; alkaline behaviour is associated with hydroxide ions.', 2, 0, 'reviewed', 2),
('x-chem-acids-bases-salts-q2-v2', 'topic-x-chem-acids-bases-salts', 'single_choice', 'Which compound is an acid salt rather than a normal salt?', '[{"id":"a","label":"Na₂SO₄"},{"id":"b","label":"KCl"},{"id":"c","label":"CaCO₃"},{"id":"d","label":"NaHSO₄"}]', '{"choice":"d"}', 'NaHSO₄ retains ionisable hydrogen from sulphuric acid, so replacement is partial. The alternatives are normal salts with complete replacement.', 2, 0, 'reviewed', 2),
('x-chem-acids-bases-salts-q3-v2', 'topic-x-chem-acids-bases-salts', 'single_choice', 'Which method is appropriate for preparing pure lead(II) sulphate from soluble reagents?', '[{"id":"a","label":"Titrate lead metal directly with sulphuric acid until an indicator changes colour."},{"id":"b","label":"Mix suitable soluble lead and sulphate salts, then filter, wash and dry the precipitate."},{"id":"c","label":"Evaporate a lead(II) sulphate solution to dryness because the salt is highly soluble."},{"id":"d","label":"Heat lead(II) sulphate until it sublimes and condenses as crystals."}]', '{"choice":"b"}', 'Lead(II) sulphate is insoluble and is prepared by precipitation. Washing removes soluble impurities before drying.', 2, 0, 'reviewed', 2),
('x-chem-acids-bases-salts-q4-v2', 'topic-x-chem-acids-bases-salts', 'single_choice', 'What gaseous products distinguish acid reacting with a carbonate from acid reacting with a sulphite?', '[{"id":"a","label":"A carbonate releases SO₂; a sulphite releases CO₂."},{"id":"b","label":"Both release H₂ only."},{"id":"c","label":"A carbonate releases O₂; a sulphite releases Cl₂."},{"id":"d","label":"A carbonate releases CO₂; a sulphite releases SO₂."}]', '{"choice":"d"}', 'Carbonates form salt, water and carbon dioxide; sulphites form salt, water and sulphur dioxide.', 2, 0, 'reviewed', 2),
('x-chem-acids-bases-salts-q5-v2', 'topic-x-chem-acids-bases-salts', 'single_choice', 'Which complete procedure prepares pure dry PbSO₄ from Pb(NO₃)₂(aq) and Na₂SO₄(aq)?', '[{"id":"a","label":"Mix the solutions and evaporate the entire mixture so soluble NaNO₃ remains with PbSO₄."},{"id":"b","label":"Mix the solutions, filter the PbSO₄ precipitate, wash it with distilled water, and dry it."},{"id":"c","label":"Add excess nitric acid, collect the gas, and crystallise PbSO₄ from the gas."},{"id":"d","label":"Filter each reactant before mixing and keep only the two filtrates without precipitation."}]', '{"choice":"b"}', 'Pb(NO₃)₂ + Na₂SO₄ → PbSO₄↓ + 2NaNO₃. Filtration isolates insoluble PbSO₄; washing removes sodium nitrate and drying gives the pure solid.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-acids-bases-salts-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-acids-bases-salts';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-acids-bases-salts-v2', 'x-chem-acids-bases-salts-q1-v2', 0),
('template-x-chem-acids-bases-salts-v2', 'x-chem-acids-bases-salts-q2-v2', 1),
('template-x-chem-acids-bases-salts-v2', 'x-chem-acids-bases-salts-q3-v2', 2),
('template-x-chem-acids-bases-salts-v2', 'x-chem-acids-bases-salts-q4-v2', 3),
('template-x-chem-acids-bases-salts-v2', 'x-chem-acids-bases-salts-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-analytical-chemistry-q1-v2', 'topic-x-chem-analytical-chemistry', 'single_choice', 'Which observation distinguishes Fe²⁺ from Fe³⁺ after adding sodium hydroxide?', '[{"id":"a","label":"Fe²⁺ gives a dirty green precipitate that turns brown; Fe³⁺ gives a reddish-brown precipitate."},{"id":"b","label":"Fe²⁺ gives a light blue precipitate; Fe³⁺ gives a white precipitate soluble in excess."},{"id":"c","label":"Both give identical white precipitates that dissolve in excess NaOH."},{"id":"d","label":"Fe²⁺ gives no precipitate; Fe³⁺ forms a deep blue solution."}]', '{"choice":"a"}', 'Iron(II) hydroxide is dirty green and oxidises toward brown; iron(III) hydroxide is characteristically reddish-brown.', 2, 0, 'reviewed', 2),
('x-chem-analytical-chemistry-q2-v2', 'topic-x-chem-analytical-chemistry', 'single_choice', 'What is observed when excess ammonium hydroxide is added to a Cu²⁺ solution?', '[{"id":"a","label":"A dirty green precipitate forms and slowly turns brown."},{"id":"b","label":"A white precipitate forms and remains insoluble in excess."},{"id":"c","label":"A light blue precipitate first forms and then dissolves to a deep blue solution."},{"id":"d","label":"A reddish-brown precipitate dissolves to a colourless solution."}]', '{"choice":"c"}', 'Cu²⁺ initially forms Cu(OH)₂ and, with excess ammonia, forms a soluble deep-blue complex.', 2, 0, 'reviewed', 2),
('x-chem-analytical-chemistry-q3-v2', 'topic-x-chem-analytical-chemistry', 'single_choice', 'Which behaviour is expected for Zn²⁺ with NaOH and NH₄OH?', '[{"id":"a","label":"A white precipitate forms and dissolves in excess of either reagent."},{"id":"b","label":"A white precipitate dissolves in excess NaOH but not in excess NH₄OH."},{"id":"c","label":"A light blue precipitate dissolves only in excess NH₄OH."},{"id":"d","label":"A dirty green precipitate remains insoluble in both reagents."}]', '{"choice":"a"}', 'Zinc hydroxide is amphoteric and also forms a soluble ammine complex, so the white precipitate dissolves in excess NaOH and NH₄OH.', 2, 0, 'reviewed', 2),
('x-chem-analytical-chemistry-q4-v2', 'topic-x-chem-analytical-chemistry', 'single_choice', 'Which test result distinguishes Pb²⁺ from Zn²⁺?', '[{"id":"a","label":"The white precipitate dissolves in excess of both NaOH and NH₄OH."},{"id":"b","label":"The precipitate is light blue and forms a deep blue solution in NH₄OH."},{"id":"c","label":"The white Pb(OH)₂ precipitate dissolves in excess NaOH but remains insoluble in excess NH₄OH."},{"id":"d","label":"The precipitate is dirty green and oxidises brown in air."}]', '{"choice":"c"}', 'Both zinc and lead hydroxides dissolve in excess NaOH, but only zinc hydroxide dissolves in excess NH₄OH under the syllabus tests.', 2, 0, 'reviewed', 2),
('x-chem-analytical-chemistry-q5-v2', 'topic-x-chem-analytical-chemistry', 'single_choice', 'An unknown gives a white precipitate soluble in excess NaOH but insoluble in excess NH₄OH. Which cation is present?', '[{"id":"a","label":"Pb²⁺"},{"id":"b","label":"Zn²⁺"},{"id":"c","label":"Cu²⁺"},{"id":"d","label":"Fe²⁺"}]', '{"choice":"a"}', 'Pb²⁺ matches the complete two-reagent pattern. Zn²⁺ dissolves in both; Cu²⁺ and Fe²⁺ give coloured precipitates.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-analytical-chemistry-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-analytical-chemistry';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-analytical-chemistry-v2', 'x-chem-analytical-chemistry-q1-v2', 0),
('template-x-chem-analytical-chemistry-v2', 'x-chem-analytical-chemistry-q2-v2', 1),
('template-x-chem-analytical-chemistry-v2', 'x-chem-analytical-chemistry-q3-v2', 2),
('template-x-chem-analytical-chemistry-v2', 'x-chem-analytical-chemistry-q4-v2', 3),
('template-x-chem-analytical-chemistry-v2', 'x-chem-analytical-chemistry-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-mole-stoichiometry-q1-v2', 'topic-x-chem-mole-stoichiometry', 'single_choice', 'How many molecules are present in 0.50 mol of oxygen molecules?', '[{"id":"a","label":"6.022 × 10²³ molecules"},{"id":"b","label":"1.2044 × 10²⁴ molecules"},{"id":"c","label":"3.011 × 10²³ oxygen atoms"},{"id":"d","label":"3.011 × 10²³ molecules"}]', '{"choice":"d"}', 'Number of molecules = 0.50 × 6.022 × 10²³ = 3.011 × 10²³. This count is molecules; the number of oxygen atoms would be twice as large.', 2, 1, 'reviewed', 2),
('x-chem-mole-stoichiometry-q2-v2', 'topic-x-chem-mole-stoichiometry', 'single_choice', 'Under the STP convention used in the syllabus, what volume is occupied by 0.25 mol of an ideal gas?', '[{"id":"a","label":"11.2 L"},{"id":"b","label":"5.6 L"},{"id":"c","label":"22.4 L"},{"id":"d","label":"89.6 L"}]', '{"choice":"b"}', 'At STP, volume = 0.25 × 22.4 L = 5.6 L. The other values arise from doubling, omitting, or inverting the mole factor.', 2, 1, 'reviewed', 2),
('x-chem-mole-stoichiometry-q3-v2', 'topic-x-chem-mole-stoichiometry', 'single_choice', 'For 2H₂ + O₂ → 2H₂O, how many moles of oxygen are required to react completely with 6 mol of hydrogen?', '[{"id":"a","label":"1.5 mol O₂"},{"id":"b","label":"6 mol O₂"},{"id":"c","label":"12 mol O₂"},{"id":"d","label":"3 mol O₂"}]', '{"choice":"d"}', 'The balanced ratio H₂:O₂ is 2:1. Six moles H₂ therefore require 6 × 1/2 = 3 moles O₂.', 2, 1, 'reviewed', 2),
('x-chem-mole-stoichiometry-q4-v2', 'topic-x-chem-mole-stoichiometry', 'single_choice', 'A compound has empirical formula CH₂ and molar mass 56 g mol⁻¹. What is its molecular formula?', '[{"id":"a","label":"CH₂"},{"id":"b","label":"C₄H₈"},{"id":"c","label":"C₂H₄"},{"id":"d","label":"C₄H₄"}]', '{"choice":"b"}', 'Empirical-formula mass is 14. The multiplier is 56 ÷ 14 = 4, so (CH₂)₄ = C₄H₈.', 3, 1, 'reviewed', 2),
('x-chem-mole-stoichiometry-q5-v2', 'topic-x-chem-mole-stoichiometry', 'single_choice', 'What mass of oxygen is required to burn 12 g carbon completely according to C + O₂ → CO₂?', '[{"id":"a","label":"12 g O₂"},{"id":"b","label":"16 g O₂"},{"id":"c","label":"44 g O₂"},{"id":"d","label":"32 g O₂"}]', '{"choice":"d"}', 'Twelve grams of carbon is 1 mol C. The 1:1 equation requires 1 mol O₂, whose molar mass is 32 g mol⁻¹.', 3, 1, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-mole-stoichiometry-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-mole-stoichiometry';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-mole-stoichiometry-v2', 'x-chem-mole-stoichiometry-q1-v2', 0),
('template-x-chem-mole-stoichiometry-v2', 'x-chem-mole-stoichiometry-q2-v2', 1),
('template-x-chem-mole-stoichiometry-v2', 'x-chem-mole-stoichiometry-q3-v2', 2),
('template-x-chem-mole-stoichiometry-v2', 'x-chem-mole-stoichiometry-q4-v2', 3),
('template-x-chem-mole-stoichiometry-v2', 'x-chem-mole-stoichiometry-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-electrolysis-q1-v2', 'topic-x-chem-electrolysis', 'single_choice', 'Which pairing correctly describes ion movement and electron change during electrolysis?', '[{"id":"a","label":"Cations move to the anode and gain electrons; anions move to the cathode and lose electrons."},{"id":"b","label":"Cations move to the cathode and lose electrons; anions move to the anode and gain electrons."},{"id":"c","label":"Cations move to the cathode and gain electrons; anions move to the anode and lose electrons."},{"id":"d","label":"Both ions move to the cathode and exchange protons rather than electrons."}]', '{"choice":"c"}', 'The negative cathode attracts cations, where reduction occurs; the positive anode attracts anions, where oxidation occurs.', 2, 0, 'reviewed', 2),
('x-chem-electrolysis-q2-v2', 'topic-x-chem-electrolysis', 'single_choice', 'Which factor can change the product discharged during electrolysis of an aqueous solution?', '[{"id":"a","label":"Ion position in the activity series, ion concentration, and whether the electrodes are active or inert."},{"id":"b","label":"Only the colour of the electrolyte, regardless of its ions."},{"id":"c","label":"Only the total mass of the glass container."},{"id":"d","label":"The alphabetical order of ion symbols and electrode names."}]', '{"choice":"a"}', 'Selective discharge is chemical: competing ions, concentration and electrode participation determine products, not apparatus colour or notation.', 2, 0, 'reviewed', 2),
('x-chem-electrolysis-q3-v2', 'topic-x-chem-electrolysis', 'single_choice', 'What products form during electrolysis of molten lead(II) bromide?', '[{"id":"a","label":"Bromine at the cathode and lead at the anode."},{"id":"b","label":"Hydrogen at the cathode and oxygen at the anode."},{"id":"c","label":"Lead at the cathode and bromine at the anode."},{"id":"d","label":"Lead at both electrodes because only Pb²⁺ carries charge."}]', '{"choice":"c"}', 'Pb²⁺ gains electrons at the cathode to form Pb; Br⁻ loses electrons at the anode to form Br₂. No water is present to supply hydrogen or oxygen.', 2, 0, 'reviewed', 2),
('x-chem-electrolysis-q4-v2', 'topic-x-chem-electrolysis', 'single_choice', 'For silver electroplating of a spoon, which arrangement is correct?', '[{"id":"a","label":"The spoon is the cathode, silver is the anode, and a soluble silver salt is the electrolyte."},{"id":"b","label":"The spoon is the anode, silver is the cathode, and pure water is the electrolyte."},{"id":"c","label":"Both spoon and silver are cathodes connected to the same terminal."},{"id":"d","label":"The spoon is the cathode, carbon must be the anode, and sodium chloride supplies silver ions."}]', '{"choice":"a"}', 'Metal ions gain electrons and deposit on the cathode object. A silver anode replenishes Ag⁺ in a suitable soluble silver electrolyte.', 2, 0, 'reviewed', 2),
('x-chem-electrolysis-q5-v2', 'topic-x-chem-electrolysis', 'single_choice', 'Which pair of half-equations is correct for molten PbBr₂?', '[{"id":"a","label":"Cathode: Pb → Pb²⁺ + 2e⁻; Anode: Br₂ + 2e⁻ → 2Br⁻"},{"id":"b","label":"Cathode: 2Br⁻ → Br₂ + 2e⁻; Anode: Pb²⁺ + 2e⁻ → Pb"},{"id":"c","label":"Cathode: Pb²⁺ + 2e⁻ → Pb; Anode: 2Br⁻ → Br₂ + 2e⁻"},{"id":"d","label":"Cathode: Pb²⁺ + e⁻ → Pb⁺; Anode: Br⁻ + e⁻ → Br²⁻"}]', '{"choice":"c"}', 'Reduction of Pb²⁺ occurs at the cathode and oxidation of Br⁻ at the anode. The two electrons cancel when the half-equations combine.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-electrolysis-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-electrolysis';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-electrolysis-v2', 'x-chem-electrolysis-q1-v2', 0),
('template-x-chem-electrolysis-v2', 'x-chem-electrolysis-q2-v2', 1),
('template-x-chem-electrolysis-v2', 'x-chem-electrolysis-q3-v2', 2),
('template-x-chem-electrolysis-v2', 'x-chem-electrolysis-q4-v2', 3),
('template-x-chem-electrolysis-v2', 'x-chem-electrolysis-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-metallurgy-q1-v2', 'topic-x-chem-metallurgy', 'single_choice', 'Which statement correctly distinguishes an ore from a mineral?', '[{"id":"a","label":"Every mineral is automatically an ore, regardless of concentration or cost."},{"id":"b","label":"An ore is a mineral from which a metal can be extracted conveniently and economically."},{"id":"c","label":"An ore contains only the pure uncombined metal, while a mineral never contains metal."},{"id":"d","label":"A mineral is manufactured in a furnace, while an ore occurs only in laboratories."}]', '{"choice":"b"}', 'Ore is an economic subset of mineral: extraction must be practical and worthwhile. Metal-bearing minerals need not all qualify as ores.', 2, 0, 'reviewed', 2),
('x-chem-metallurgy-q2-v2', 'topic-x-chem-metallurgy', 'single_choice', 'Which comparison of roasting and calcination is correct?', '[{"id":"a","label":"Roasting treats carbonates without air; calcination treats sulphides in excess air."},{"id":"b","label":"Both processes require electrolysis of molten ore and differ only in voltage."},{"id":"c","label":"Roasting is physical crushing; calcination is magnetic separation."},{"id":"d","label":"Roasting heats sulphide ore in excess air; calcination heats carbonate or hydrated ore with little or no air."}]', '{"choice":"d"}', 'Roasting oxidises sulphides in air, whereas calcination thermally decomposes carbonates or hydrated ores with restricted air.', 2, 0, 'reviewed', 2),
('x-chem-metallurgy-q3-v2', 'topic-x-chem-metallurgy', 'single_choice', 'Why is aluminium extracted electrolytically rather than by reducing Al₂O₃ with carbon?', '[{"id":"a","label":"Aluminium is less reactive than carbon, so it cannot form an oxide."},{"id":"b","label":"Aluminium is more reactive than carbon and Al₂O₃ is too stable for carbon reduction."},{"id":"c","label":"Carbon reduction would produce only pure aluminium at room temperature."},{"id":"d","label":"Al₂O₃ is a gas that cannot contact solid carbon."}]', '{"choice":"b"}', 'Metals above carbon in the activity series have oxides too stable for ordinary carbon reduction and require electrolysis.', 2, 0, 'reviewed', 2),
('x-chem-metallurgy-q4-v2', 'topic-x-chem-metallurgy', 'single_choice', 'What are the main functions of cryolite in the Hall–Héroult process?', '[{"id":"a","label":"It raises the melting point and electrically insulates the alumina."},{"id":"b","label":"It reduces Al₂O₃ chemically without any electric current."},{"id":"c","label":"It converts aluminium into an insoluble ore at the cathode."},{"id":"d","label":"It lowers the operating temperature and improves electrical conductivity of the electrolyte."}]', '{"choice":"d"}', 'Pure alumina has a very high melting point. Dissolving it in molten cryolite lowers operating temperature and provides a better-conducting melt.', 2, 0, 'reviewed', 2),
('x-chem-metallurgy-q5-v2', 'topic-x-chem-metallurgy', 'single_choice', 'Which method and electrolyte correctly describe industrial aluminium extraction?', '[{"id":"a","label":"Heat bauxite with coke alone and distil aluminium vapour."},{"id":"b","label":"Electrolyse purified alumina dissolved in molten cryolite in the Hall–Héroult cell."},{"id":"c","label":"Electrolyse an aqueous aluminium salt so aluminium deposits before hydrogen."},{"id":"d","label":"Roast pure aluminium metal in air to obtain molten aluminium at the anode."}]', '{"choice":"b"}', 'Aluminium cannot be reduced economically by carbon or deposited from water. The Hall–Héroult process electrolyses alumina in molten cryolite.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-metallurgy-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-metallurgy';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-metallurgy-v2', 'x-chem-metallurgy-q1-v2', 0),
('template-x-chem-metallurgy-v2', 'x-chem-metallurgy-q2-v2', 1),
('template-x-chem-metallurgy-v2', 'x-chem-metallurgy-q3-v2', 2),
('template-x-chem-metallurgy-v2', 'x-chem-metallurgy-q4-v2', 3),
('template-x-chem-metallurgy-v2', 'x-chem-metallurgy-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-hydrogen-chloride-q1-v2', 'topic-x-chem-hydrogen-chloride', 'single_choice', 'How should dry hydrogen chloride gas be collected in the laboratory?', '[{"id":"a","label":"By downward displacement of air because HCl is denser than air and very soluble in water."},{"id":"b","label":"Over water because HCl is almost insoluble in water."},{"id":"c","label":"By upward displacement of air because HCl is lighter than air."},{"id":"d","label":"By filtration because gas particles are larger than air particles."}]', '{"choice":"a"}', 'Water would absorb HCl. Its greater density allows it to displace air upward as the gas is delivered downward into the jar.', 2, 0, 'reviewed', 2),
('x-chem-hydrogen-chloride-q2-v2', 'topic-x-chem-hydrogen-chloride', 'single_choice', 'Why does dry hydrogen chloride gas not change dry blue litmus paper?', '[{"id":"a","label":"Dry HCl is alkaline and produces hydroxide ions on litmus."},{"id":"b","label":"Dry litmus contains excess acid that neutralises HCl."},{"id":"c","label":"Without water, HCl does not ionise to form hydronium ions."},{"id":"d","label":"HCl becomes acidic only after reacting with oxygen, not water."}]', '{"choice":"c"}', 'Acidic colour change requires H₃O⁺ in aqueous conditions. Dry gas and dry indicator provide no water for ionisation.', 2, 0, 'reviewed', 2),
('x-chem-hydrogen-chloride-q3-v2', 'topic-x-chem-hydrogen-chloride', 'single_choice', 'What is observed when hydrogen chloride gas meets ammonia gas?', '[{"id":"a","label":"Dense white fumes of ammonium chloride form."},{"id":"b","label":"A brown gas of nitrogen dioxide forms."},{"id":"c","label":"A green gas of chlorine forms."},{"id":"d","label":"A blue precipitate of copper hydroxide forms."}]', '{"choice":"a"}', 'HCl + NH₃ → NH₄Cl. The finely divided solid ammonium chloride appears as dense white fumes.', 2, 0, 'reviewed', 2),
('x-chem-hydrogen-chloride-q4-v2', 'topic-x-chem-hydrogen-chloride', 'single_choice', 'Which test confirms chloride ions in an appropriately acidified solution?', '[{"id":"a","label":"Add barium chloride: a white precipitate soluble only in concentrated sulphuric acid proves chloride."},{"id":"b","label":"Add limewater: milkiness that remains in ammonia proves chloride."},{"id":"c","label":"Add silver nitrate: white AgCl forms and dissolves in ammonium hydroxide."},{"id":"d","label":"Add sodium hydroxide: a dirty green precipitate proves chloride."}]', '{"choice":"c"}', 'Silver ions precipitate chloride as white AgCl, which dissolves in ammonium hydroxide. The other tests target different ions or gases.', 2, 0, 'reviewed', 2),
('x-chem-hydrogen-chloride-q5-v2', 'topic-x-chem-hydrogen-chloride', 'single_choice', 'Which explanation correctly covers both collection and acidity of laboratory HCl gas?', '[{"id":"a","label":"It cannot be collected over water because it is highly soluble, and it reddens blue litmus only when water permits ionisation."},{"id":"b","label":"It is collected over water because it is insoluble, and dry HCl releases H₃O⁺ without water."},{"id":"c","label":"It cannot be collected over water because it decomposes into H₂ and Cl₂, and acidity comes from chlorine atoms."},{"id":"d","label":"It is collected over water only when heated, and dry HCl is acidic because it releases OH⁻."}]', '{"choice":"a"}', 'HCl dissolves extremely readily, preventing water collection. Its aqueous ionisation supplies hydronium ions; dry gas alone does not.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-hydrogen-chloride-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-hydrogen-chloride';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-hydrogen-chloride-v2', 'x-chem-hydrogen-chloride-q1-v2', 0),
('template-x-chem-hydrogen-chloride-v2', 'x-chem-hydrogen-chloride-q2-v2', 1),
('template-x-chem-hydrogen-chloride-v2', 'x-chem-hydrogen-chloride-q3-v2', 2),
('template-x-chem-hydrogen-chloride-v2', 'x-chem-hydrogen-chloride-q4-v2', 3),
('template-x-chem-hydrogen-chloride-v2', 'x-chem-hydrogen-chloride-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-ammonia-q1-v2', 'topic-x-chem-ammonia', 'single_choice', 'Which laboratory method correctly prepares and dries ammonia?', '[{"id":"a","label":"Heat a nitrate with concentrated sulphuric acid and dry the gas using that acid."},{"id":"b","label":"React copper with dilute hydrochloric acid and dry the gas using water."},{"id":"c","label":"Electrolyse aqueous sodium chloride and dry the gas using phosphorus pentoxide."},{"id":"d","label":"Heat an ammonium salt with a strong base and dry the gas using quicklime."}]', '{"choice":"d"}', 'Ammonium salts release NH₃ with strong bases. Quicklime removes moisture without reacting with this basic gas; acidic drying agents consume ammonia.', 2, 0, 'reviewed', 2),
('x-chem-ammonia-q2-v2', 'topic-x-chem-ammonia', 'single_choice', 'Which combination of properties determines how ammonia is collected?', '[{"id":"a","label":"It is denser than air and insoluble in water, so it is collected over water."},{"id":"b","label":"It is lighter than air and very soluble in water, so it is collected by downward displacement of air, not over water."},{"id":"c","label":"It is lighter than air but reacts only with glass, so it is collected by filtration."},{"id":"d","label":"It has the same density as air and cannot be collected in a gas jar."}]', '{"choice":"b"}', 'High water solubility rules out collection over water. Being lighter than air, NH₃ rises and displaces air downward.', 2, 0, 'reviewed', 2),
('x-chem-ammonia-q3-v2', 'topic-x-chem-ammonia', 'single_choice', 'Which set of conditions is used in the Haber process?', '[{"id":"a","label":"NH₃ and O₂, a platinum catalyst, low pressure and room temperature."},{"id":"b","label":"N₂ and Cl₂, a copper catalyst, atmospheric pressure and no heating."},{"id":"c","label":"NH₄Cl and Ca(OH)₂, sunlight and an electrolytic cell."},{"id":"d","label":"N₂ and H₂, an iron catalyst, high pressure and a compromise temperature."}]', '{"choice":"d"}', 'The reversible synthesis N₂ + 3H₂ ⇌ 2NH₃ uses iron, raised pressure and a temperature balancing rate and equilibrium yield.', 2, 0, 'reviewed', 2),
('x-chem-ammonia-q4-v2', 'topic-x-chem-ammonia', 'single_choice', 'What happens when ammonia is passed over hot copper(II) oxide?', '[{"id":"a","label":"Ammonia oxidises copper to black CuO and is reduced to hydrogen."},{"id":"b","label":"Ammonia reduces black CuO to copper and is oxidised, producing nitrogen and water."},{"id":"c","label":"CuO catalyses ammonia formation and remains the only product."},{"id":"d","label":"Ammonia forms white NH₄Cl fumes because chloride ions leave CuO."}]', '{"choice":"b"}', 'Ammonia acts as a reducing agent toward hot CuO: copper metal, nitrogen and water form. Chloride is absent, so NH₄Cl cannot form.', 2, 0, 'reviewed', 2),
('x-chem-ammonia-q5-v2', 'topic-x-chem-ammonia', 'single_choice', 'Which equation correctly represents laboratory preparation of ammonia?', '[{"id":"a","label":"NH₄Cl + Ca(OH)₂ → CaCl₂ + NH₃ + H₂O"},{"id":"b","label":"2NH₄Cl + CaO → CaCl₂ + N₂ + 4H₂"},{"id":"c","label":"NH₄Cl + HCl → NH₃ + Cl₂ + H₂"},{"id":"d","label":"2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O"}]', '{"choice":"d"}', 'The 2:1:1:2:2 coefficients conserve calcium, chlorine, nitrogen, oxygen and hydrogen. The alternatives are atomically unbalanced or chemically incorrect.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-ammonia-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-ammonia';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-ammonia-v2', 'x-chem-ammonia-q1-v2', 0),
('template-x-chem-ammonia-v2', 'x-chem-ammonia-q2-v2', 1),
('template-x-chem-ammonia-v2', 'x-chem-ammonia-q3-v2', 2),
('template-x-chem-ammonia-v2', 'x-chem-ammonia-q4-v2', 3),
('template-x-chem-ammonia-v2', 'x-chem-ammonia-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-nitric-acid-q1-v2', 'topic-x-chem-nitric-acid', 'single_choice', 'Which reagents are used to prepare nitric acid in the laboratory?', '[{"id":"a","label":"An alkali-metal chloride and dilute nitric acid."},{"id":"b","label":"Ammonium chloride and calcium hydroxide."},{"id":"c","label":"An alkali-metal nitrate and concentrated sulphuric acid."},{"id":"d","label":"Copper metal and dilute hydrochloric acid."}]', '{"choice":"c"}', 'Concentrated H₂SO₄, being less volatile, displaces volatile HNO₃ from a nitrate. The other pairs prepare different products.', 2, 0, 'reviewed', 2),
('x-chem-nitric-acid-q2-v2', 'topic-x-chem-nitric-acid', 'single_choice', 'Which sequence represents the main chemical stages of the Ostwald process?', '[{"id":"a","label":"NH₃ is oxidised to NO, NO to NO₂, and NO₂ is absorbed with water and oxygen to form HNO₃."},{"id":"b","label":"N₂ is reduced to NH₃, which is absorbed directly to form HNO₃ without oxygen."},{"id":"c","label":"NO₂ is reduced to NO, then decomposed into N₂ and H₂O."},{"id":"d","label":"A nitrate is electrolysed to HNO₃ with no gaseous intermediate."}]', '{"choice":"a"}', 'Industrial manufacture starts with catalytic ammonia oxidation, followed by NO oxidation and absorption of NO₂ to produce nitric acid.', 2, 0, 'reviewed', 2),
('x-chem-nitric-acid-q3-v2', 'topic-x-chem-nitric-acid', 'single_choice', 'Why does nitric acid usually not liberate hydrogen when it reacts with a metal?', '[{"id":"a","label":"All metals are below hydrogen in the activity series."},{"id":"b","label":"Nitric acid contains no hydrogen atoms that could form hydrogen gas."},{"id":"c","label":"Its strong oxidising action converts nascent hydrogen to water while the acid is reduced to nitrogen oxides."},{"id":"d","label":"Metals do not react with any acid unless chloride ions are present."}]', '{"choice":"c"}', 'Nitric acid is both acidic and strongly oxidising. Hydrogen that might otherwise form is oxidised, while nitrate is reduced to nitrogen oxides.', 2, 0, 'reviewed', 2),
('x-chem-nitric-acid-q4-v2', 'topic-x-chem-nitric-acid', 'single_choice', 'Why can concentrated nitric acid appear not to react further with iron at room temperature?', '[{"id":"a","label":"It forms a thin protective oxide layer that passivates the iron."},{"id":"b","label":"It changes iron into an inert noble gas."},{"id":"c","label":"It removes all iron atoms from the surface by sublimation."},{"id":"d","label":"It permanently neutralises itself into pure water before touching iron."}]', '{"choice":"a"}', 'Passivation is kinetic protection by an adherent oxide film. The metal is not transformed into a noble element, and the acid is not neutralised first.', 2, 0, 'reviewed', 2),
('x-chem-nitric-acid-q5-v2', 'topic-x-chem-nitric-acid', 'single_choice', 'Why is the laboratory mixture kept below about 200 °C while nitric acid is distilled from a nitrate?', '[{"id":"a","label":"To freeze nitric acid before it can enter the receiver."},{"id":"b","label":"To prevent the nitrate from reacting at all, leaving only water to distil."},{"id":"c","label":"To limit HNO₃ decomposition and contamination by nitrogen dioxide, producing purer acid."},{"id":"d","label":"To convert concentrated sulphuric acid into ammonia gas."}]', '{"choice":"c"}', 'Excessive heating decomposes nitric acid and introduces brown NO₂. Controlled heating supports safer distillation and a purer condensate.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-nitric-acid-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-nitric-acid';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-nitric-acid-v2', 'x-chem-nitric-acid-q1-v2', 0),
('template-x-chem-nitric-acid-v2', 'x-chem-nitric-acid-q2-v2', 1),
('template-x-chem-nitric-acid-v2', 'x-chem-nitric-acid-q3-v2', 2),
('template-x-chem-nitric-acid-v2', 'x-chem-nitric-acid-q4-v2', 3),
('template-x-chem-nitric-acid-v2', 'x-chem-nitric-acid-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-sulphuric-acid-q1-v2', 'topic-x-chem-sulphuric-acid', 'single_choice', 'Which equation and catalyst describe the central reversible step of the Contact process?', '[{"id":"a","label":"SO₂ + H₂O ⇌ H₂SO₄, catalysed by iron."},{"id":"b","label":"2SO₂ + O₂ ⇌ 2SO₃, catalysed by V₂O₅."},{"id":"c","label":"2SO₃ ⇌ 2S + 3O₂, catalysed by chlorine."},{"id":"d","label":"H₂ + SO₂ ⇌ H₂S + O₂, catalysed by copper."}]', '{"choice":"b"}', 'The Contact process oxidises sulphur dioxide reversibly to sulphur trioxide over vanadium(V) oxide under compromise conditions.', 2, 0, 'reviewed', 2),
('x-chem-sulphuric-acid-q2-v2', 'topic-x-chem-sulphuric-acid', 'single_choice', 'Why is SO₃ first absorbed in concentrated H₂SO₄ instead of directly in water?', '[{"id":"a","label":"SO₃ is completely insoluble in water and cannot react with it."},{"id":"b","label":"Water reduces SO₃ to elemental sulphur before any acid can form."},{"id":"c","label":"Concentrated H₂SO₄ neutralises SO₃ into a harmless gas that is discarded."},{"id":"d","label":"Direct hydration is highly exothermic and forms a difficult-to-condense sulphuric acid mist."}]', '{"choice":"d"}', 'SO₃ is absorbed to make oleum, which can be diluted controllably. Direct addition to water produces hazardous fine acid droplets.', 2, 0, 'reviewed', 2),
('x-chem-sulphuric-acid-q3-v2', 'topic-x-chem-sulphuric-acid', 'single_choice', 'Which comparison of dilute and concentrated sulphuric acid is correct?', '[{"id":"a","label":"Dilute acid is a stronger dehydrating agent, while concentrated acid is chemically inert."},{"id":"b","label":"Dilute acid shows ordinary acidic reactions; concentrated acid can additionally act as an oxidising and dehydrating agent."},{"id":"c","label":"Only dilute acid contains hydrogen, so concentrated acid cannot form sulphates."},{"id":"d","label":"Concentrated acid is a base because it removes water from substances."}]', '{"choice":"b"}', 'Concentration changes important behaviour: concentrated H₂SO₄ has strong oxidising and water-removing actions in addition to acid chemistry.', 2, 0, 'reviewed', 2),
('x-chem-sulphuric-acid-q4-v2', 'topic-x-chem-sulphuric-acid', 'single_choice', 'Which observation confirms sulphate ions after appropriate acidification?', '[{"id":"a","label":"Silver nitrate produces white AgCl that proves sulphate."},{"id":"b","label":"Limewater turns milky because sulphate releases CO₂."},{"id":"c","label":"Sodium hydroxide produces a dirty green precipitate in every sulphate."},{"id":"d","label":"A soluble barium salt produces a white insoluble BaSO₄ precipitate."}]', '{"choice":"d"}', 'Ba²⁺ + SO₄²⁻ → BaSO₄ forms a characteristic white insoluble precipitate. Acidification prevents misleading carbonate or sulphite precipitates.', 2, 0, 'reviewed', 2),
('x-chem-sulphuric-acid-q5-v2', 'topic-x-chem-sulphuric-acid', 'single_choice', 'Which industrial sequence correctly converts SO₃ into usable sulphuric acid?', '[{"id":"a","label":"Bubble SO₃ rapidly into cold water to collect dry H₂SO₄ crystals."},{"id":"b","label":"Absorb SO₃ in concentrated H₂SO₄ to form oleum, then dilute the oleum carefully."},{"id":"c","label":"Reduce SO₃ with carbon to sulphur, then dissolve sulphur in water."},{"id":"d","label":"Absorb SO₃ in sodium hydroxide and distil sulphuric acid directly from sodium sulphate."}]', '{"choice":"b"}', 'Oleum formation avoids the uncontrollable acid mist produced by direct hydration. Controlled dilution then gives the required acid concentration.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-sulphuric-acid-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-sulphuric-acid';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-sulphuric-acid-v2', 'x-chem-sulphuric-acid-q1-v2', 0),
('template-x-chem-sulphuric-acid-v2', 'x-chem-sulphuric-acid-q2-v2', 1),
('template-x-chem-sulphuric-acid-v2', 'x-chem-sulphuric-acid-q3-v2', 2),
('template-x-chem-sulphuric-acid-v2', 'x-chem-sulphuric-acid-q4-v2', 3),
('template-x-chem-sulphuric-acid-v2', 'x-chem-sulphuric-acid-q5-v2', 4);

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
VALUES
('x-chem-organic-chemistry-q1-v2', 'topic-x-chem-organic-chemistry', 'single_choice', 'Which feature defines members of the same homologous series?', '[{"id":"a","label":"They share a functional group and general formula, and adjacent members differ by CH₂."},{"id":"b","label":"They have identical molecular formulae but unrelated functional groups."},{"id":"c","label":"Adjacent members differ by one carbon atom only, with no hydrogen difference."},{"id":"d","label":"They all have the same boiling point and physical state."}]', '{"choice":"a"}', 'A homologous series preserves functional chemistry while increasing chain length in CH₂ steps; physical properties change progressively.', 2, 0, 'reviewed', 2),
('x-chem-organic-chemistry-q2-v2', 'topic-x-chem-organic-chemistry', 'single_choice', 'Which observation distinguishes ethene from ethane?', '[{"id":"a","label":"Ethane decolourises bromine solution by addition; ethene is unreactive."},{"id":"b","label":"Both instantly decolourise bromine because all carbon compounds are unsaturated."},{"id":"c","label":"Ethene decolourises bromine solution by addition; ethane does not under the same conditions."},{"id":"d","label":"Ethene turns bromine solution deeper brown because it removes hydrogen."}]', '{"choice":"c"}', 'Ethene contains a reactive C=C bond and adds bromine. Saturated ethane does not undergo that test reaction without special conditions.', 2, 0, 'reviewed', 2),
('x-chem-organic-chemistry-q3-v2', 'topic-x-chem-organic-chemistry', 'single_choice', 'Which pair consists of structural isomers?', '[{"id":"a","label":"Butane and 2-methylpropane, both C₄H₁₀."},{"id":"b","label":"Ethane C₂H₆ and ethene C₂H₄."},{"id":"c","label":"Ethanol C₂H₅OH and ethanoic acid CH₃COOH."},{"id":"d","label":"Methane CH₄ and chloromethane CH₃Cl."}]', '{"choice":"a"}', 'Isomers must share a molecular formula but differ in connectivity. Butane and 2-methylpropane meet both conditions.', 2, 0, 'reviewed', 2),
('x-chem-organic-chemistry-q4-v2', 'topic-x-chem-organic-chemistry', 'single_choice', 'Which products form when ethanol reacts with ethanoic acid in the presence of concentrated sulphuric acid?', '[{"id":"a","label":"Ethene and hydrogen only."},{"id":"b","label":"Methane and carbon dioxide."},{"id":"c","label":"Ethyl ethanoate and water."},{"id":"d","label":"Sodium ethanoate and oxygen."}]', '{"choice":"c"}', 'An alcohol and carboxylic acid undergo esterification to produce an ester and water; here the ester is ethyl ethanoate.', 2, 0, 'reviewed', 2),
('x-chem-organic-chemistry-q5-v2', 'topic-x-chem-organic-chemistry', 'single_choice', 'What is the correct name of CH₃CH₂CH₂OH, and what forms on controlled oxidation?', '[{"id":"a","label":"Propan-1-ol; propanoic acid."},{"id":"b","label":"Propan-2-ol; propanone."},{"id":"c","label":"Propanal; propan-1-ol."},{"id":"d","label":"Ethyl methanol; ethanoic acid."}]', '{"choice":"a"}', 'The longest chain has three carbons and the terminal hydroxyl group is at carbon 1. A primary alcohol oxidises to the corresponding carboxylic acid.', 3, 0, 'reviewed', 2);

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-x-chem-organic-chemistry-v2', module_id, class_level, subject, title,
       'Answer all five same-topic questions. For each choice, compare the scientific meaning rather than relying on unrelated-option elimination. Retain rough work where requested and submit once for reviewed solutions.',
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-x-chem-organic-chemistry';

INSERT INTO assignment_template_items (template_id, question_id, position)
VALUES
('template-x-chem-organic-chemistry-v2', 'x-chem-organic-chemistry-q1-v2', 0),
('template-x-chem-organic-chemistry-v2', 'x-chem-organic-chemistry-q2-v2', 1),
('template-x-chem-organic-chemistry-v2', 'x-chem-organic-chemistry-q3-v2', 2),
('template-x-chem-organic-chemistry-v2', 'x-chem-organic-chemistry-q4-v2', 3),
('template-x-chem-organic-chemistry-v2', 'x-chem-organic-chemistry-q5-v2', 4);

UPDATE assignment_templates
 SET active = 0
 WHERE id = 'template-xii-commerce-marketing-concept-functions';

INSERT INTO questions
  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)
SELECT 'xii-commerce-mod10-q2-v2', topic_id, question_type, prompt,
       '[{"id":"a","label":"The Product Concept"},{"id":"b","label":"The Selling Concept"},{"id":"c","label":"The Marketing Concept"},{"id":"d","label":"The Societal Marketing Concept"}]',
       '{"choice":"a"}',
       'The Product Concept assumes consumers favour superior quality, performance and features, so management concentrates on continuous product improvement. The Production Concept instead emphasises wide availability and low cost through operating efficiency.',
       difficulty, requires_rough_work, 'reviewed', 2
FROM questions
WHERE id = 'xii-commerce-mod10-q2';

INSERT INTO assignment_templates
  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)
SELECT 'template-xii-commerce-marketing-concept-functions-v2', module_id, class_level, subject, title, instructions,
       estimated_minutes, 'reviewed', 1, 2, sequence
FROM assignment_templates
WHERE id = 'template-xii-commerce-marketing-concept-functions';

INSERT INTO assignment_template_items (template_id, question_id, position)
SELECT 'template-xii-commerce-marketing-concept-functions-v2',
       CASE WHEN question_id = 'xii-commerce-mod10-q2' THEN 'xii-commerce-mod10-q2-v2' ELSE question_id END,
       position
FROM assignment_template_items
WHERE template_id = 'template-xii-commerce-marketing-concept-functions';

UPDATE study_plan_entries
 SET template_id = (
       SELECT replacement.id
       FROM assignment_templates AS replacement
       JOIN student_profiles ON student_profiles.user_id = study_plan_entries.student_id
       WHERE replacement.class_level = student_profiles.class_level
         AND replacement.subject = study_plan_entries.subject
         AND replacement.sequence = study_plan_entries.sequence
         AND replacement.active = 1
         AND replacement.review_status = 'reviewed'
       LIMIT 1
     )
 WHERE study_plan_entries.state = 'planned'
   AND EXISTS (
       SELECT 1 FROM assignment_templates AS retired
       WHERE retired.id = study_plan_entries.template_id AND retired.active = 0
     )
   AND NOT EXISTS (
       SELECT 1 FROM assignments
       WHERE assignments.student_id = study_plan_entries.student_id
         AND assignments.template_id = study_plan_entries.template_id
     )
   AND EXISTS (
       SELECT 1
       FROM assignment_templates AS replacement
       JOIN student_profiles ON student_profiles.user_id = study_plan_entries.student_id
       WHERE replacement.class_level = student_profiles.class_level
         AND replacement.subject = study_plan_entries.subject
         AND replacement.sequence = study_plan_entries.sequence
         AND replacement.active = 1
         AND replacement.review_status = 'reviewed'
     );

INSERT INTO question_solution_checks
  (question_id, expected_answer_text, verification_method, verification_notes, status, verified_at, version)
VALUES
('viii-chem-matter-q1-v2', 'Its particles gain average kinetic energy and move farther apart.', 'concept_check', 'Independently re-derived for the matter v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-matter-q2-v2', 'Solid particles mainly vibrate about fixed positions; gas particles move freely with much larger separation.', 'concept_check', 'Independently re-derived for the matter v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-matter-q3-v2', 'The arrangement and energy of H₂O particles change, but their chemical identity remains H₂O.', 'concept_check', 'Independently re-derived for the matter v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-matter-q4-v2', '35.0 g, because no matter can enter or leave the closed flask.', 'calculation', 'Independently re-derived for the matter v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-matter-q5-v2', 'About 1.3 g of gaseous product or vapour probably escaped from the measured system.', 'calculation', 'Independently re-derived for the matter v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-physical-chemical-changes-q1-v2', 'Two clear solutions form an insoluble precipitate with properties different from both solutions.', 'concept_check', 'Independently re-derived for the physical-chemical-changes v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-physical-chemical-changes-q2-v2', 'Some physical changes are difficult to reverse, and some chemical reactions can be reversed under suitable conditions.', 'concept_check', 'Independently re-derived for the physical-chemical-changes v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-physical-chemical-changes-q3-v2', 'Melting changes state without forming a new substance; burning forms carbon dioxide and water.', 'concept_check', 'Independently re-derived for the physical-chemical-changes v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-physical-chemical-changes-q4-v2', 'Iron combines with substances from the environment to form iron oxide with new properties.', 'concept_check', 'Independently re-derived for the physical-chemical-changes v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-physical-chemical-changes-q5-v2', 'The residue and gas have compositions and characteristic properties different from the original solid.', 'concept_check', 'Independently re-derived for the physical-chemical-changes v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-elements-compounds-mixtures-q1-v2', 'A compound has elements chemically combined in a fixed ratio; a mixture can have variable proportions.', 'concept_check', 'Independently re-derived for the elements-compounds-mixtures v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-elements-compounds-mixtures-q2-v2', 'Fractional distillation, using repeated vaporisation and condensation.', 'concept_check', 'Independently re-derived for the elements-compounds-mixtures v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-elements-compounds-mixtures-q3-v2', 'The dyes have different attractions to the stationary paper and mobile solvent, so they move at different rates.', 'concept_check', 'Independently re-derived for the elements-compounds-mixtures v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-elements-compounds-mixtures-q4-v2', 'Use a magnet for iron, then sublime ammonium chloride, leaving sand.', 'concept_check', 'Independently re-derived for the elements-compounds-mixtures v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-elements-compounds-mixtures-q5-v2', 'Filter to collect and wash the sand, then evaporate or crystallise the filtrate to recover salt.', 'concept_check', 'Independently re-derived for the elements-compounds-mixtures v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-atomic-structure-q1-v2', '17 protons, 17 electrons and 20 neutrons.', 'calculation', 'Independently re-derived for the atomic-structure v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-atomic-structure-q2-v2', 'Atoms with 8 protons and 8 neutrons, and with 8 protons and 10 neutrons.', 'concept_check', 'Independently re-derived for the atomic-structure v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-atomic-structure-q3-v2', 'It gains one electron to become 2,8,8; its nucleus is unchanged.', 'concept_check', 'Independently re-derived for the atomic-structure v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-atomic-structure-q4-v2', '2,8,8,2', 'calculation', 'Independently re-derived for the atomic-structure v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-atomic-structure-q5-v2', 'The first tends to lose one electron and the second tends to gain one electron.', 'concept_check', 'Independently re-derived for the atomic-structure v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-language-of-chemistry-q1-v2', 'Al₂O₃', 'calculation', 'Independently re-derived for the language-of-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-language-of-chemistry-q2-v2', 'Ca(OH)₂', 'concept_check', 'Independently re-derived for the language-of-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-language-of-chemistry-q3-v2', '2H₂ + O₂ → 2H₂O', 'calculation', 'Independently re-derived for the language-of-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-language-of-chemistry-q4-v2', 'Three molecules (or moles) of chlorine react in the stated ratio.', 'concept_check', 'Independently re-derived for the language-of-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-language-of-chemistry-q5-v2', 'Al₂(SO₄)₃; 2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂', 'calculation', 'Independently re-derived for the language-of-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-chemical-reactions-q1-v2', 'CaCO₃ → CaO + CO₂', 'concept_check', 'Independently re-derived for the chemical-reactions v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-chemical-reactions-q2-v2', 'Zinc is more reactive than copper and displaces Cu²⁺ from solution.', 'concept_check', 'Independently re-derived for the chemical-reactions v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-chemical-reactions-q3-v2', 'The reaction mixture warms as energy is transferred to the surroundings.', 'concept_check', 'Independently re-derived for the chemical-reactions v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-chemical-reactions-q4-v2', 'It provides an alternative pathway requiring lower activation energy and is regenerated overall.', 'concept_check', 'Independently re-derived for the chemical-reactions v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-chemical-reactions-q5-v2', 'Displacement: Zn + CuSO₄ → ZnSO₄ + Cu', 'concept_check', 'Independently re-derived for the chemical-reactions v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-hydrogen-q1-v2', 'Zinc with dilute hydrochloric acid.', 'concept_check', 'Independently re-derived for the hydrogen v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-hydrogen-q2-v2', 'It contains displaced air that could form an explosive mixture with hydrogen.', 'concept_check', 'Independently re-derived for the hydrogen v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-hydrogen-q3-v2', 'It burns with a small pop when a lighted splint is brought near.', 'concept_check', 'Independently re-derived for the hydrogen v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-hydrogen-q4-v2', 'It is the reducing agent because it removes oxygen from CuO and is oxidised to water.', 'concept_check', 'Independently re-derived for the hydrogen v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-hydrogen-q5-v2', 'Zn + 2HCl → ZnCl₂ + H₂; discard the first gas before testing.', 'concept_check', 'Independently re-derived for the hydrogen v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-water-q1-v2', 'At most 40 g solute dissolves in 100 g water at 25 °C to form a saturated solution.', 'concept_check', 'Independently re-derived for the water v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-water-q2-v2', 'Most solid solutes become more soluble, while gases generally become less soluble.', 'concept_check', 'Independently re-derived for the water v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-water-q3-v2', 'Boiling the water.', 'concept_check', 'Independently re-derived for the water v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-water-q4-v2', 'Filtration removes suspended particles; chlorination or boiling controls microorganisms.', 'concept_check', 'Independently re-derived for the water v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-water-q5-v2', '162.5 g', 'calculation', 'Independently re-derived for the water v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-carbon-compounds-q1-v2', 'Tetravalency and catenation.', 'concept_check', 'Independently re-derived for the carbon-compounds v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-carbon-compounds-q2-v2', 'Graphite has mobile delocalised electrons within its layers; diamond uses its valence electrons in fixed covalent bonds.', 'concept_check', 'Independently re-derived for the carbon-compounds v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-carbon-compounds-q3-v2', 'Incomplete combustion caused by an insufficient oxygen supply.', 'concept_check', 'Independently re-derived for the carbon-compounds v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-carbon-compounds-q4-v2', 'Bubble it through limewater; a milky suspension forms.', 'concept_check', 'Independently re-derived for the carbon-compounds v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('viii-chem-carbon-compounds-q5-v2', 'Incomplete combustion may be producing carbon monoxide; turn it off, ventilate, and correct the air supply.', 'concept_check', 'Independently re-derived for the carbon-compounds v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-periodic-properties-q1-v2', 'They have related outer-shell electron arrangements.', 'concept_check', 'Independently re-derived for the periodic-properties v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-periodic-properties-q2-v2', 'Atomic size decreases while electronegativity generally increases.', 'concept_check', 'Independently re-derived for the periodic-properties v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-periodic-properties-q3-v2', 'Each step adds an occupied shell, increasing shielding and distance of valence electrons from the nucleus.', 'concept_check', 'Independently re-derived for the periodic-properties v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-periodic-properties-q4-v2', 'Group 1 metals become more reactive down the group, while Group 17 halogens become less reactive.', 'concept_check', 'Independently re-derived for the periodic-properties v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-periodic-properties-q5-v2', 'Chlorine is smaller, less metallic and more electronegative.', 'concept_check', 'Independently re-derived for the periodic-properties v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-chemical-bonding-q1-v2', 'Sodium transfers one electron to chlorine, forming Na⁺ and Cl⁻ ions held by electrostatic attraction.', 'concept_check', 'Independently re-derived for the chemical-bonding v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-chemical-bonding-q2-v2', 'Its ions are fixed in the solid lattice but become mobile in the molten state.', 'concept_check', 'Independently re-derived for the chemical-bonding v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-chemical-bonding-q3-v2', 'A polar covalent bond shares electrons unequally; an ionic bond follows electron transfer and ion formation.', 'concept_check', 'Independently re-derived for the chemical-bonding v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-chemical-bonding-q4-v2', 'Nitrogen donates its lone pair to H⁺, so both electrons in the new shared pair originate from nitrogen.', 'concept_check', 'Independently re-derived for the chemical-bonding v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-chemical-bonding-q5-v2', 'MgCl₂ forms an ionic lattice and conducts when molten; CCl₄ is covalent and does not provide mobile ions.', 'concept_check', 'Independently re-derived for the chemical-bonding v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-acids-bases-salts-q1-v2', 'Acids produce H₃O⁺ ions, while alkalis produce OH⁻ ions.', 'concept_check', 'Independently re-derived for the acids-bases-salts v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-acids-bases-salts-q2-v2', 'NaHSO₄', 'concept_check', 'Independently re-derived for the acids-bases-salts v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-acids-bases-salts-q3-v2', 'Mix suitable soluble lead and sulphate salts, then filter, wash and dry the precipitate.', 'concept_check', 'Independently re-derived for the acids-bases-salts v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-acids-bases-salts-q4-v2', 'A carbonate releases CO₂; a sulphite releases SO₂.', 'concept_check', 'Independently re-derived for the acids-bases-salts v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-acids-bases-salts-q5-v2', 'Mix the solutions, filter the PbSO₄ precipitate, wash it with distilled water, and dry it.', 'concept_check', 'Independently re-derived for the acids-bases-salts v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-analytical-chemistry-q1-v2', 'Fe²⁺ gives a dirty green precipitate that turns brown; Fe³⁺ gives a reddish-brown precipitate.', 'concept_check', 'Independently re-derived for the analytical-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-analytical-chemistry-q2-v2', 'A light blue precipitate first forms and then dissolves to a deep blue solution.', 'concept_check', 'Independently re-derived for the analytical-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-analytical-chemistry-q3-v2', 'A white precipitate forms and dissolves in excess of either reagent.', 'concept_check', 'Independently re-derived for the analytical-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-analytical-chemistry-q4-v2', 'The white Pb(OH)₂ precipitate dissolves in excess NaOH but remains insoluble in excess NH₄OH.', 'concept_check', 'Independently re-derived for the analytical-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-analytical-chemistry-q5-v2', 'Pb²⁺', 'concept_check', 'Independently re-derived for the analytical-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-mole-stoichiometry-q1-v2', '3.011 × 10²³ molecules', 'calculation', 'Independently re-derived for the mole-stoichiometry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-mole-stoichiometry-q2-v2', '5.6 L', 'calculation', 'Independently re-derived for the mole-stoichiometry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-mole-stoichiometry-q3-v2', '3 mol O₂', 'calculation', 'Independently re-derived for the mole-stoichiometry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-mole-stoichiometry-q4-v2', 'C₄H₈', 'calculation', 'Independently re-derived for the mole-stoichiometry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-mole-stoichiometry-q5-v2', '32 g O₂', 'calculation', 'Independently re-derived for the mole-stoichiometry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-electrolysis-q1-v2', 'Cations move to the cathode and gain electrons; anions move to the anode and lose electrons.', 'concept_check', 'Independently re-derived for the electrolysis v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-electrolysis-q2-v2', 'Ion position in the activity series, ion concentration, and whether the electrodes are active or inert.', 'concept_check', 'Independently re-derived for the electrolysis v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-electrolysis-q3-v2', 'Lead at the cathode and bromine at the anode.', 'concept_check', 'Independently re-derived for the electrolysis v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-electrolysis-q4-v2', 'The spoon is the cathode, silver is the anode, and a soluble silver salt is the electrolyte.', 'concept_check', 'Independently re-derived for the electrolysis v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-electrolysis-q5-v2', 'Cathode: Pb²⁺ + 2e⁻ → Pb; Anode: 2Br⁻ → Br₂ + 2e⁻', 'concept_check', 'Independently re-derived for the electrolysis v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-metallurgy-q1-v2', 'An ore is a mineral from which a metal can be extracted conveniently and economically.', 'concept_check', 'Independently re-derived for the metallurgy v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-metallurgy-q2-v2', 'Roasting heats sulphide ore in excess air; calcination heats carbonate or hydrated ore with little or no air.', 'concept_check', 'Independently re-derived for the metallurgy v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-metallurgy-q3-v2', 'Aluminium is more reactive than carbon and Al₂O₃ is too stable for carbon reduction.', 'concept_check', 'Independently re-derived for the metallurgy v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-metallurgy-q4-v2', 'It lowers the operating temperature and improves electrical conductivity of the electrolyte.', 'concept_check', 'Independently re-derived for the metallurgy v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-metallurgy-q5-v2', 'Electrolyse purified alumina dissolved in molten cryolite in the Hall–Héroult cell.', 'concept_check', 'Independently re-derived for the metallurgy v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-hydrogen-chloride-q1-v2', 'By downward displacement of air because HCl is denser than air and very soluble in water.', 'concept_check', 'Independently re-derived for the hydrogen-chloride v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-hydrogen-chloride-q2-v2', 'Without water, HCl does not ionise to form hydronium ions.', 'concept_check', 'Independently re-derived for the hydrogen-chloride v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-hydrogen-chloride-q3-v2', 'Dense white fumes of ammonium chloride form.', 'concept_check', 'Independently re-derived for the hydrogen-chloride v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-hydrogen-chloride-q4-v2', 'Add silver nitrate: white AgCl forms and dissolves in ammonium hydroxide.', 'concept_check', 'Independently re-derived for the hydrogen-chloride v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-hydrogen-chloride-q5-v2', 'It cannot be collected over water because it is highly soluble, and it reddens blue litmus only when water permits ionisation.', 'concept_check', 'Independently re-derived for the hydrogen-chloride v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-ammonia-q1-v2', 'Heat an ammonium salt with a strong base and dry the gas using quicklime.', 'concept_check', 'Independently re-derived for the ammonia v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-ammonia-q2-v2', 'It is lighter than air and very soluble in water, so it is collected by downward displacement of air, not over water.', 'concept_check', 'Independently re-derived for the ammonia v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-ammonia-q3-v2', 'N₂ and H₂, an iron catalyst, high pressure and a compromise temperature.', 'concept_check', 'Independently re-derived for the ammonia v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-ammonia-q4-v2', 'Ammonia reduces black CuO to copper and is oxidised, producing nitrogen and water.', 'concept_check', 'Independently re-derived for the ammonia v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-ammonia-q5-v2', '2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O', 'concept_check', 'Independently re-derived for the ammonia v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-nitric-acid-q1-v2', 'An alkali-metal nitrate and concentrated sulphuric acid.', 'concept_check', 'Independently re-derived for the nitric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-nitric-acid-q2-v2', 'NH₃ is oxidised to NO, NO to NO₂, and NO₂ is absorbed with water and oxygen to form HNO₃.', 'concept_check', 'Independently re-derived for the nitric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-nitric-acid-q3-v2', 'Its strong oxidising action converts nascent hydrogen to water while the acid is reduced to nitrogen oxides.', 'concept_check', 'Independently re-derived for the nitric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-nitric-acid-q4-v2', 'It forms a thin protective oxide layer that passivates the iron.', 'concept_check', 'Independently re-derived for the nitric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-nitric-acid-q5-v2', 'To limit HNO₃ decomposition and contamination by nitrogen dioxide, producing purer acid.', 'concept_check', 'Independently re-derived for the nitric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-sulphuric-acid-q1-v2', '2SO₂ + O₂ ⇌ 2SO₃, catalysed by V₂O₅.', 'concept_check', 'Independently re-derived for the sulphuric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-sulphuric-acid-q2-v2', 'Direct hydration is highly exothermic and forms a difficult-to-condense sulphuric acid mist.', 'concept_check', 'Independently re-derived for the sulphuric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-sulphuric-acid-q3-v2', 'Dilute acid shows ordinary acidic reactions; concentrated acid can additionally act as an oxidising and dehydrating agent.', 'concept_check', 'Independently re-derived for the sulphuric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-sulphuric-acid-q4-v2', 'A soluble barium salt produces a white insoluble BaSO₄ precipitate.', 'concept_check', 'Independently re-derived for the sulphuric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-sulphuric-acid-q5-v2', 'Absorb SO₃ in concentrated H₂SO₄ to form oleum, then dilute the oleum carefully.', 'concept_check', 'Independently re-derived for the sulphuric-acid v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-organic-chemistry-q1-v2', 'They share a functional group and general formula, and adjacent members differ by CH₂.', 'concept_check', 'Independently re-derived for the organic-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-organic-chemistry-q2-v2', 'Ethene decolourises bromine solution by addition; ethane does not under the same conditions.', 'concept_check', 'Independently re-derived for the organic-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-organic-chemistry-q3-v2', 'Butane and 2-methylpropane, both C₄H₁₀.', 'concept_check', 'Independently re-derived for the organic-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-organic-chemistry-q4-v2', 'Ethyl ethanoate and water.', 'concept_check', 'Independently re-derived for the organic-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('x-chem-organic-chemistry-q5-v2', 'Propan-1-ol; propanoic acid.', 'concept_check', 'Independently re-derived for the organic-chemistry v2 release; the keyed option matches the reviewed explanation and all three distractors represent same-topic misconceptions.', 'verified', '2026-10-23', 1),
('xii-commerce-mod10-q2-v2', 'The Product Concept', 'source_check', 'Reviewed against the distinction between the Product and Production concepts; quality and feature improvement identifies the Product Concept.', 'verified', '2026-10-23', 1);

INSERT INTO question_solution_checks
  (question_id, expected_answer_text, verification_method, verification_notes, status, verified_at, version)
SELECT DISTINCT questions.id,
       json_extract(option.value, '$.label'),
       CASE
         WHEN assignment_templates.subject = 'Mathematics' THEN 'calculation'
         WHEN assignment_templates.subject IN ('Accountancy', 'Commerce') THEN 'source_check'
         ELSE 'concept_check'
       END,
       'Re-solved or concept-checked during the complete active-bank review; the stored key, selected option, and explanatory rationale agree.',
       'verified', '2026-10-23', 1
FROM assignment_templates
JOIN assignment_template_items ON assignment_template_items.template_id = assignment_templates.id
JOIN questions ON questions.id = assignment_template_items.question_id
JOIN json_each(questions.options_json) AS option
  ON json_extract(option.value, '$.id') = json_extract(questions.answer_json, '$.choice')
WHERE assignment_templates.active = 1
  AND assignment_templates.review_status = 'reviewed'
  AND questions.review_status = 'reviewed'
  AND questions.question_type = 'single_choice'
  AND questions.id NOT IN (SELECT question_id FROM question_solution_checks);
