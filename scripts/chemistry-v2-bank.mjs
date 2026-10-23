// Original Home Study MCQs. Each distractor targets a misconception inside the same chapter.
// The order in this file is syllabus order and each chapter contains exactly five questions.

const q = (prompt, correct, distractors, rationale, method = 'concept_check', difficulty = 2) => ({
	prompt,
	correct,
	distractors,
	rationale,
	method,
	difficulty,
});

export const chemistryV2Bank = [
	{
		classLevel: 'VIII',
		slug: 'matter',
		questions: [
			q(
				'Which particle-level change best explains why a gas expands when heated at constant pressure?',
				'Its particles gain average kinetic energy and move farther apart.',
				[
					'Its particles increase in size while their motion stays unchanged.',
					'Its particles lose kinetic energy and move closer together.',
					'New gas particles are created as temperature rises.',
				],
				'Heating raises average kinetic energy. Faster particles require more space at constant pressure; particles themselves neither grow nor appear.',
			),
			q(
				'Which comparison of particles in a solid and a gas is correct?',
				'Solid particles mainly vibrate about fixed positions; gas particles move freely with much larger separation.',
				[
					'Solid particles are motionless; gas particles vibrate only about fixed positions.',
					'Solid particles are farther apart than gas particles but attract more strongly.',
					'Solid and gas particles have the same separation; only particle size changes.',
				],
				'Particles in every state move. Solids have closely packed particles vibrating around fixed positions, whereas gas particles are widely separated and move freely.',
			),
			q(
				'Ice melts to liquid water in a closed container. Which statement is correct?',
				'The arrangement and energy of H₂O particles change, but their chemical identity remains H₂O.',
				[
					'H₂O molecules split into hydrogen and oxygen during melting.',
					'New H₂O molecules are created because liquid occupies a different volume.',
					'The chemical formula changes temporarily and returns to H₂O on freezing.',
				],
				'Melting is a physical change: particle arrangement and energy change, but no new substance forms and the molecules remain H₂O.',
			),
			q(
				'A sealed flask has a total mass of 35.0 g before two solutions react and form a precipitate. What mass should it have after the reaction?',
				'35.0 g, because no matter can enter or leave the closed flask.',
				[
					'Less than 35.0 g, because formation of a solid destroys some dissolved matter.',
					'More than 35.0 g, because a precipitate has extra mass compared with its ions.',
					'It cannot be predicted unless the mass of the precipitate alone is measured.',
				],
				'Conservation of mass applies to the complete closed system. A change of state or formation of a precipitate does not create or destroy matter.',
				'calculation',
			),
			q(
				'A student reacts 10.0 g of reactants in an open beaker and measures 8.7 g afterward. What is the best explanation consistent with conservation of mass?',
				'About 1.3 g of gaseous product or vapour probably escaped from the measured system.',
				[
					'About 1.3 g of matter was destroyed by the chemical reaction.',
					'The products necessarily contain fewer atoms than the reactants.',
					'Conservation of mass applies only to physical changes, not chemical reactions.',
				],
				'The missing measured mass does not imply destroyed matter. In an open system, gas or vapour can leave; including it restores the total to 10.0 g.',
				'calculation',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'physical-chemical-changes',
		questions: [
			q(
				'Which observation most strongly supports that a chemical change occurred?',
				'Two clear solutions form an insoluble precipitate with properties different from both solutions.',
				[
					'A solid is crushed into a fine powder without changing composition.',
					'Ice melts after absorbing heat and can freeze again.',
					'Sugar disappears uniformly when stirred into water and is recovered by evaporation.',
				],
				'A precipitate produced from dissolved reactants is a new substance and is strong evidence of chemical change; crushing, melting and dissolving need not alter composition.',
			),
			q(
				'Why is reversibility alone an unreliable test for distinguishing physical and chemical changes?',
				'Some physical changes are difficult to reverse, and some chemical reactions can be reversed under suitable conditions.',
				[
					'Every physical change is irreversible, while every chemical change is reversible.',
					'Reversibility proves only that heat was absorbed during the change.',
					'Only changes involving gases can be reversed.',
				],
				'The decisive test is formation of substances with new chemical compositions, not whether the original state is easy to restore.',
			),
			q(
				'Which statement correctly compares melting candle wax with burning candle vapour?',
				'Melting changes state without forming a new substance; burning forms carbon dioxide and water.',
				[
					'Both are chemical because both require heat from the flame.',
					'Both are physical because the candle can be relit after cooling.',
					'Melting is chemical because wax becomes liquid; burning is physical because gases form.',
				],
				'Heating does not by itself define a chemical change. Melting preserves wax composition, while combustion rearranges atoms into new products.',
			),
			q(
				'An iron nail rusts slowly in moist air. Which feature makes rusting a chemical change?',
				'Iron combines with substances from the environment to form iron oxide with new properties.',
				[
					'The change is slow rather than immediate.',
					'The nail surface becomes rougher while remaining pure iron.',
					'The nail can no longer fit its original container.',
				],
				'Rust is a new compound formed by reaction of iron with oxygen and moisture. Rate, shape and convenience of reversal do not define the change type.',
			),
			q(
				'A white solid is heated and gives off a gas, leaving a different solid. Which follow-up evidence would best confirm a chemical change?',
				'The residue and gas have compositions and characteristic properties different from the original solid.',
				[
					'The original solid was broken into smaller grains before heating.',
					'The apparatus became warm while being heated externally.',
					'The residue occupies less space than the original powder.',
				],
				'Chemical change is confirmed by new substances, not merely by heating, size reduction, or a volume difference. Different composition and properties provide the decisive evidence.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'elements-compounds-mixtures',
		questions: [
			q(
				'Which statement distinguishes a compound from a mixture of the same elements?',
				'A compound has elements chemically combined in a fixed ratio; a mixture can have variable proportions.',
				[
					'A compound keeps all properties of its elements; a mixture always forms new properties.',
					'A compound is separated by physical methods; a mixture requires chemical decomposition.',
					'A compound contains one kind of atom; a mixture contains one kind of molecule.',
				],
				'Fixed composition and chemical bonding distinguish a compound. Mixture components retain many properties and can usually be separated physically.',
			),
			q(
				'Which method is most suitable for separating two miscible liquids whose boiling points are close?',
				'Fractional distillation, using repeated vaporisation and condensation.',
				[
					'A separating funnel, because the liquids form different layers.',
					'Filtration, because one liquid passes through the filter first.',
					'Sublimation, because the lower-boiling liquid changes directly to a gas.',
				],
				'Miscible liquids do not form layers. Close boiling points require a fractionating column; filtration and sublimation do not separate two liquids in solution.',
			),
			q(
				'Why can paper chromatography separate dyes dissolved in the same solvent?',
				'The dyes have different attractions to the stationary paper and mobile solvent, so they move at different rates.',
				[
					'The paper chemically converts each dye into a different element.',
					'The heaviest dye is trapped only because its particles are too large for paper pores.',
					'Each dye boils at a sharply different temperature while moving up the paper.',
				],
				'Chromatographic separation depends on unequal partition or attraction between stationary and mobile phases, not filtration, boiling, or chemical decomposition.',
			),
			q(
				'A mixture contains iron filings, ammonium chloride and sand. Which sequence separates all three?',
				'Use a magnet for iron, then sublime ammonium chloride, leaving sand.',
				[
					'Sublime the iron first, then dissolve the sand and filter ammonium chloride.',
					'Filter the dry mixture, then use a separating funnel for iron and sand.',
					'Evaporate the iron, magnetise ammonium chloride, and decant the sand.',
				],
				'Iron is magnetic, ammonium chloride sublimes, and sand is neither magnetic nor sublimable under these conditions. The order uses two relevant property differences.',
			),
			q(
				'Salt solution contains insoluble sand. Which sequence recovers both clean sand and solid salt?',
				'Filter to collect and wash the sand, then evaporate or crystallise the filtrate to recover salt.',
				[
					'Evaporate first until both sand and salt pass into the vapour.',
					'Use a separating funnel because dissolved salt forms a lower liquid layer.',
					'Use a magnet for the salt, then filter the remaining sand-water mixture.',
				],
				'Filtration removes the insoluble sand; dissolved salt remains in the filtrate and is recovered by evaporation or crystallisation.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'atomic-structure',
		questions: [
			q(
				'A neutral atom has atomic number 17 and mass number 37. Which description is correct?',
				'17 protons, 17 electrons and 20 neutrons.',
				[
					'17 protons, 20 electrons and 17 neutrons.',
					'20 protons, 17 electrons and 17 neutrons.',
					'17 protons, 17 electrons and 37 neutrons.',
				],
				'Atomic number gives 17 protons and, for a neutral atom, 17 electrons. Neutrons equal mass number minus atomic number: 37 − 17 = 20.',
				'calculation',
			),
			q(
				'Which pair represents isotopes of the same element?',
				'Atoms with 8 protons and 8 neutrons, and with 8 protons and 10 neutrons.',
				[
					'Atoms with 8 protons and 8 neutrons, and with 10 protons and 8 neutrons.',
					'Atoms with 8 electrons and 8 neutrons, and with 10 protons and 10 neutrons.',
					'Atoms with mass numbers 8 and 10 but with different proton numbers.',
				],
				'Isotopes have the same proton number and different neutron numbers, giving the same atomic number but different mass numbers.',
			),
			q(
				'What happens when a neutral chlorine atom with electron arrangement 2,8,7 forms Cl⁻?',
				'It gains one electron to become 2,8,8; its nucleus is unchanged.',
				[
					'It loses one proton to become 2,8,8; its mass number decreases.',
					'It gains one proton and one electron to become 2,8,8.',
					'It loses seven electrons so that only the first two shells remain.',
				],
				'An anion forms by electron gain. Ordinary ion formation changes only electrons, not the numbers of protons or neutrons in the nucleus.',
			),
			q(
				'Which electron arrangement belongs to a neutral calcium atom with atomic number 20?',
				'2,8,8,2',
				['2,8,10', '2,8,7,3', '2,10,8'],
				'A neutral calcium atom has 20 electrons. Filling shells for the first twenty elements gives 2 + 8 + 8 + 2 = 20.',
				'calculation',
			),
			q(
				'Two neutral atoms have arrangements 2,8,1 and 2,8,7. Which prediction is most reasonable?',
				'The first tends to lose one electron and the second tends to gain one electron.',
				[
					'Both tend to lose seven electrons to empty their outer shells.',
					'The first tends to gain seven electrons and the second tends to lose seven.',
					'Neither can form ions because both already have three occupied shells.',
				],
				'Atoms tend toward stable outer-shell arrangements: 2,8,1 most readily loses one electron, while 2,8,7 most readily gains one.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'language-of-chemistry',
		questions: [
			q(
				'Which formula correctly represents aluminium oxide formed from Al³⁺ and O²⁻?',
				'Al₂O₃',
				['AlO', 'Al₃O₂', 'Al₂O₆'],
				'The smallest neutral ratio uses 2 Al³⁺ ions (+6) and 3 O²⁻ ions (−6), giving Al₂O₃ rather than unreduced or charge-unbalanced subscripts.',
				'calculation',
			),
			q(
				'Which formula correctly uses brackets for calcium hydroxide?',
				'Ca(OH)₂',
				['CaOH₂', 'Ca₂OH', 'Ca₂(OH)'],
				'Calcium is Ca²⁺ and hydroxide is the polyatomic ion OH⁻. Two complete hydroxide ions are required, so the group is bracketed: Ca(OH)₂.',
			),
			q(
				'Which equation is correctly balanced without changing any chemical formula?',
				'2H₂ + O₂ → 2H₂O',
				['H₂ + O₂ → H₂O', 'H₂ + O₂ → H₂O₂', '2H₂ + 2O₂ → 2H₂O'],
				'Coefficients 2:1:2 give four H atoms and two O atoms on each side. Changing H₂O to H₂O₂ would change the substance, not balance the equation.',
				'calculation',
			),
			q(
				'What does the coefficient 3 mean in 2Al + 3Cl₂ → 2AlCl₃?',
				'Three molecules (or moles) of chlorine react in the stated ratio.',
				[
					'Each chlorine molecule contains three chlorine atoms.',
					'The formula of chlorine has been changed from Cl₂ to Cl₃.',
					'Three aluminium atoms are present in every unit of AlCl₃.',
				],
				'A coefficient counts whole particles or moles and multiplies the complete formula. It does not alter subscripts or composition.',
			),
			q(
				'Which formula and balanced equation correctly show aluminium reacting with sulphuric acid?',
				'Al₂(SO₄)₃; 2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂',
				['AlSO₄; Al + H₂SO₄ → AlSO₄ + H₂', 'Al₃(SO₄)₂; 3Al + 2H₂SO₄ → Al₃(SO₄)₂ + 2H₂', 'Al₂SO₄; 2Al + H₂SO₄ → Al₂SO₄ + H₂'],
				'Al³⁺ and SO₄²⁻ require the ratio 2:3. The equation then balances with coefficients 2, 3, 1 and 3.',
				'calculation',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'chemical-reactions',
		questions: [
			q(
				'Which equation represents a decomposition reaction?',
				'CaCO₃ → CaO + CO₂',
				['2Mg + O₂ → 2MgO', 'Zn + CuSO₄ → ZnSO₄ + Cu', 'AgNO₃ + NaCl → AgCl + NaNO₃'],
				'One compound splitting into simpler substances is decomposition. The alternatives show combination, displacement and double displacement.',
			),
			q(
				'Zinc is placed in copper(II) sulphate solution. Why does copper form?',
				'Zinc is more reactive than copper and displaces Cu²⁺ from solution.',
				[
					'Copper is more reactive than zinc and therefore leaves the solution first.',
					'Zinc and copper exchange protons in a neutralisation reaction.',
					'Copper(II) sulphate decomposes solely because the solution is stirred.',
				],
				'A more reactive metal displaces a less reactive metal from its compound: Zn + CuSO₄ → ZnSO₄ + Cu.',
			),
			q(
				'Which observation indicates an exothermic reaction when no external heating is supplied?',
				'The reaction mixture warms as energy is transferred to the surroundings.',
				[
					'The mixture cools because energy is released from the surroundings.',
					'The temperature remains constant, which proves heat is released.',
					'The reactants absorb heat and the surroundings become warmer.',
				],
				'An exothermic reaction releases energy to the surroundings, commonly causing a measurable temperature rise. Cooling instead suggests net energy absorption.',
			),
			q(
				'How does a catalyst increase reaction rate?',
				'It provides an alternative pathway requiring lower activation energy and is regenerated overall.',
				[
					'It raises the energy of every product and is consumed completely.',
					'It changes the final amount predicted by the balanced equation by adding atoms.',
					'It prevents effective particle collisions while increasing temperature.',
				],
				'A catalyst lowers the activation-energy barrier, increasing the fraction of effective collisions. It changes rate, not stoichiometry, and is not consumed overall.',
			),
			q(
				'Which classification and balanced equation apply when zinc is added to copper(II) sulphate solution?',
				'Displacement: Zn + CuSO₄ → ZnSO₄ + Cu',
				[
					'Combination: Zn + CuSO₄ → ZnCuSO₄',
					'Decomposition: ZnSO₄ → Zn + SO₄',
					'Double displacement: Zn + CuSO₄ → Cu + ZnSO₄ because both metals exchange anions.',
				],
				'Elemental zinc replaces copper from one compound, so this is single displacement. The 1:1:1:1 equation conserves each element.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'hydrogen',
		questions: [
			q(
				'Which laboratory combination safely prepares hydrogen gas?',
				'Zinc with dilute hydrochloric acid.',
				['Copper with dilute hydrochloric acid.', 'Zinc with concentrated nitric acid.', 'Silver with water at room temperature.'],
				'Zinc displaces hydrogen from a dilute non-oxidising acid. Copper and silver are too unreactive in these conditions, while nitric acid is oxidising.',
			),
			q(
				'Why is the first gas from a hydrogen preparation apparatus allowed to escape?',
				'It contains displaced air that could form an explosive mixture with hydrogen.',
				[
					'Pure hydrogen is too dense to collect during the first minute.',
					'The first hydrogen contains water that makes it non-flammable forever.',
					'Air converts hydrogen into carbon dioxide inside the flask.',
				],
				'The apparatus initially contains air. Testing that first hydrogen-air mixture with a flame is dangerous, so it is flushed out before collection or ignition.',
			),
			q(
				'Which observation is the characteristic test for hydrogen?',
				'It burns with a small pop when a lighted splint is brought near.',
				[
					'It relights a glowing splint without any sound.',
					'It turns limewater milky immediately.',
					'It turns moist blue litmus red and bleaches it.',
				],
				'Hydrogen ignites rapidly in air and gives the characteristic pop. Relighting a glowing splint tests oxygen; limewater tests carbon dioxide.',
			),
			q(
				'In CuO + H₂ → Cu + H₂O, what role does hydrogen play?',
				'It is the reducing agent because it removes oxygen from CuO and is oxidised to water.',
				[
					'It is the oxidising agent because it gives oxygen to copper.',
					'It is a catalyst because it remains unchanged after the reaction.',
					'It is an inert carrier gas because copper alone removes the oxygen.',
				],
				'Hydrogen reduces copper(II) oxide by removing oxygen; hydrogen itself gains oxygen and is oxidised to H₂O.',
			),
			q(
				'Which equation and precaution correctly describe preparation of hydrogen from zinc and dilute hydrochloric acid?',
				'Zn + 2HCl → ZnCl₂ + H₂; discard the first gas before testing.',
				[
					'Zn + HCl → ZnCl + H₂; ignite the first gas immediately.',
					'2Zn + HCl → Zn₂Cl + H₂; collect the first gas in a sealed hot vessel.',
					'Zn + 2HCl → ZnCl₂ + 2H; test the atomic hydrogen inside the generator.',
				],
				'The balanced equation conserves Zn, H and Cl. The first gas may contain an explosive air-hydrogen mixture and must be discarded.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'water',
		questions: [
			q(
				'What does a solubility of 40 g per 100 g water at 25 °C mean?',
				'At most 40 g solute dissolves in 100 g water at 25 °C to form a saturated solution.',
				[
					'Every 100 g of saturated solution contains exactly 40 g water.',
					'Exactly 40 g dissolves at every temperature, regardless of the solvent mass.',
					'Forty grams is the minimum needed before any solute begins to dissolve.',
				],
				'Solubility is a maximum amount for a stated solvent mass and temperature. It is not the composition of 100 g solution or a temperature-independent value.',
			),
			q(
				'How does heating usually affect solubility in water?',
				'Most solid solutes become more soluble, while gases generally become less soluble.',
				[
					'All solids become less soluble and all gases become more soluble.',
					'Both solids and gases always become more soluble by exactly the same amount.',
					'Temperature affects dissolving speed only and never the final solubility.',
				],
				'The common trend is increasing solubility for many solids and decreasing solubility for gases, though individual substances may vary.',
			),
			q(
				'Which treatment removes temporary hardness but normally does not remove permanent hardness?',
				'Boiling the water.',
				['Simple filtration.', 'Adding more soap.', 'Passing the water through clean sand only.'],
				'Boiling decomposes soluble hydrogencarbonates responsible for temporary hardness. Permanent chlorides or sulphates require ion exchange, washing soda, or distillation.',
			),
			q(
				'Which pairing of water-treatment method and purpose is correct?',
				'Filtration removes suspended particles; chlorination or boiling controls microorganisms.',
				[
					'Filtration removes all dissolved salts; chlorination removes sand.',
					'Boiling removes every dissolved mineral; sedimentation kills microorganisms.',
					'Chlorination removes permanent hardness; filtration removes dissolved ions.',
				],
				'Different hazards need different treatments. Filters retain suspended matter, while heat or disinfectant controls microbes; ordinary filtration does not remove dissolved ions.',
			),
			q(
				'At 40 °C, 65 g of a salt dissolves in 100 g of water. How much dissolves in 250 g of water at the same temperature?',
				'162.5 g',
				['26.0 g', '115.0 g', '260.0 g'],
				'At unchanged temperature the amount scales with solvent mass: 65 × 250 ÷ 100 = 162.5 g. The distractors reverse or misapply the proportion.',
				'calculation',
				3,
			),
		],
	},
	{
		classLevel: 'VIII',
		slug: 'carbon-compounds',
		questions: [
			q(
				'Which pair of properties explains why carbon forms so many compounds?',
				'Tetravalency and catenation.',
				['Monovalency and ionisation.', 'Inertness and metallic bonding.', 'Radioactivity and sublimation.'],
				'Carbon forms four covalent bonds and stable bonds to other carbon atoms, enabling chains, branches and rings. The alternatives do not describe its organic diversity.',
			),
			q(
				'Why does graphite conduct electricity while diamond normally does not?',
				'Graphite has mobile delocalised electrons within its layers; diamond uses its valence electrons in fixed covalent bonds.',
				[
					'Graphite is ionic and releases ions, while diamond is made of isolated atoms.',
					'Diamond has mobile electrons only at room temperature, while graphite has none.',
					'Graphite conducts because its layers melt, while diamond remains solid.',
				],
				'Both are covalent allotropes, but their structures differ. Graphite retains delocalised electrons; diamond has a rigid network with no mobile charge carriers.',
			),
			q(
				'Which condition is most likely to produce poisonous carbon monoxide from a fuel?',
				'Incomplete combustion caused by an insufficient oxygen supply.',
				['Complete combustion in excess oxygen.', 'Cooling carbon dioxide in an open room.', 'Passing pure oxygen over fully burned ash.'],
				'Limited oxygen can prevent complete oxidation to CO₂ and produce CO. Adequate ventilation and a clean blue flame reduce this risk.',
			),
			q(
				'Which test identifies carbon dioxide?',
				'Bubble it through limewater; a milky suspension forms.',
				[
					'Apply a lighted splint; a popping sound proves carbon dioxide.',
					'Expose dry red litmus; it turns blue without water.',
					'Pass it over copper(II) oxide; a bright copper deposit forms.',
				],
				'Carbon dioxide reacts with limewater to form insoluble calcium carbonate, causing milkiness. The pop test is for hydrogen.',
			),
			q(
				'A burner has a yellow smoky flame in a closed kitchen. What is the safest interpretation and response?',
				'Incomplete combustion may be producing carbon monoxide; turn it off, ventilate, and correct the air supply.',
				[
					'Complete combustion is occurring; close all vents to conserve heat.',
					'Only harmless carbon dioxide is produced; increase the fuel flow.',
					'The smoke proves graphite is conducting electricity; add water to the flame.',
				],
				'A yellow smoky flame indicates insufficient oxygen and possible CO formation. CO prevents effective oxygen transport in blood, so immediate shutdown and ventilation are required.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'periodic-properties',
		questions: [
			q(
				'Which statement best explains why elements in the same group have similar chemical properties?',
				'They have related outer-shell electron arrangements.',
				[
					'They have the same number of occupied shells.',
					'They have identical atomic numbers.',
					'They have equal numbers of protons and neutrons.',
				],
				'Chemical behaviour depends strongly on valence electrons. Period number, not group, gives occupied shells; every element has a unique atomic number.',
			),
			q(
				'Across Period 3 from sodium toward chlorine, which general trend is correct?',
				'Atomic size decreases while electronegativity generally increases.',
				[
					'Atomic size increases while electronegativity generally decreases.',
					'Both atomic size and electronegativity generally decrease.',
					'Atomic size remains constant because all atoms have three shells.',
				],
				'Increasing nuclear charge acts across the same principal shell, pulling electrons closer and raising attraction for bonding electrons.',
			),
			q(
				'Why does atomic size generally increase down a group?',
				'Each step adds an occupied shell, increasing shielding and distance of valence electrons from the nucleus.',
				[
					'Nuclear charge decreases because lower elements contain fewer protons.',
					'Valence electrons enter the same shell and are pulled progressively closer.',
					'Atoms lose every inner electron as the group is descended.',
				],
				'Additional shells and shielding outweigh increased nuclear charge, so the outer electrons are farther from the nucleus.',
			),
			q(
				'Which reactivity trend is generally correct?',
				'Group 1 metals become more reactive down the group, while Group 17 halogens become less reactive.',
				[
					'Both Group 1 metals and Group 17 halogens become less reactive down their groups.',
					'Group 1 metals become less reactive, while Group 17 halogens become more reactive.',
					'Both groups become more reactive because atomic size always decreases downward.',
				],
				'Larger Group 1 atoms lose an electron more easily; increased size and shielding make electron gain less favourable down Group 17.',
			),
			q(
				'Compared with sodium in the same period, which description of chlorine is correct?',
				'Chlorine is smaller, less metallic and more electronegative.',
				[
					'Chlorine is larger, more metallic and less electronegative.',
					'Chlorine is smaller, more metallic and less electronegative.',
					'Chlorine has an extra occupied shell and therefore a larger radius.',
				],
				'Both use three occupied shells, but chlorine has greater nuclear charge. It pulls the shell closer, has reduced metallic character and attracts bonding electrons more strongly.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'chemical-bonding',
		questions: [
			q(
				'What happens when sodium chloride forms by electrovalent bonding?',
				'Sodium transfers one electron to chlorine, forming Na⁺ and Cl⁻ ions held by electrostatic attraction.',
				[
					'Sodium and chlorine share one electron equally to form neutral atoms.',
					'Chlorine transfers a proton to sodium, forming Na⁻ and Cl⁺.',
					'Sodium and chlorine exchange neutrons and remain uncharged.',
				],
				'Ionic bonding involves electron transfer and attraction between opposite ions. Nuclei and proton counts do not change.',
			),
			q(
				'Why does solid sodium chloride not conduct electricity while molten sodium chloride does?',
				'Its ions are fixed in the solid lattice but become mobile in the molten state.',
				[
					'The solid contains no charged particles, but melting creates electrons.',
					'Solid NaCl conducts only through stationary ions; melting stops their movement.',
					'Melting converts NaCl into an uncharged covalent molecule.',
				],
				'NaCl contains ions in both states. Electrical conduction requires those ions to move, which becomes possible after the lattice melts.',
			),
			q(
				'Which statement correctly distinguishes a polar covalent bond from an ionic bond?',
				'A polar covalent bond shares electrons unequally; an ionic bond follows electron transfer and ion formation.',
				[
					'A polar covalent bond transfers all bonding electrons; an ionic bond shares them equally.',
					'Both require complete electron transfer, but only the polar bond forms ions.',
					'Neither involves valence electrons; both arise from neutron attraction.',
				],
				'Unequal electronegativity can produce unequal sharing without complete transfer. Ionic bonding instead produces oppositely charged ions.',
			),
			q(
				'How is the coordinate bond formed when NH₃ becomes NH₄⁺?',
				'Nitrogen donates its lone pair to H⁺, so both electrons in the new shared pair originate from nitrogen.',
				[
					'H⁺ donates two electrons to nitrogen and remains neutral.',
					'Nitrogen transfers a proton to NH₃ and loses its lone pair completely.',
					'One electron comes from nitrogen and one from H⁺ exactly as in an ordinary covalent bond.',
				],
				'A coordinate bond is a shared pair supplied by one donor atom. Ammonia supplies its nitrogen lone pair to electron-deficient H⁺.',
			),
			q(
				'Which comparison of magnesium chloride and carbon tetrachloride is most accurate?',
				'MgCl₂ forms an ionic lattice and conducts when molten; CCl₄ is covalent and does not provide mobile ions.',
				[
					'MgCl₂ is covalent and conducts as a solid; CCl₄ is ionic and conducts when molten.',
					'Both are ionic because both contain chlorine, so both conduct as solids.',
					'Both are simple covalent substances and conduct through freely moving electrons.',
				],
				'Bonding depends on electron transfer or sharing, not merely on the elements present. Ionic MgCl₂ conducts only when ions are mobile; molecular CCl₄ lacks such carriers.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'acids-bases-salts',
		questions: [
			q(
				'In aqueous solutions, which pairing of substances and characteristic ions is correct?',
				'Acids produce H₃O⁺ ions, while alkalis produce OH⁻ ions.',
				[
					'Acids produce OH⁻ ions, while alkalis produce H₃O⁺ ions.',
					'Acids produce free H⁺ without interacting with water, while alkalis produce oxygen gas.',
					'Both acids and alkalis produce only neutral molecules in water.',
				],
				'Acidic behaviour in water is associated with hydronium ions; alkaline behaviour is associated with hydroxide ions.',
			),
			q(
				'Which compound is an acid salt rather than a normal salt?',
				'NaHSO₄',
				['Na₂SO₄', 'KCl', 'CaCO₃'],
				'NaHSO₄ retains ionisable hydrogen from sulphuric acid, so replacement is partial. The alternatives are normal salts with complete replacement.',
			),
			q(
				'Which method is appropriate for preparing pure lead(II) sulphate from soluble reagents?',
				'Mix suitable soluble lead and sulphate salts, then filter, wash and dry the precipitate.',
				[
					'Titrate lead metal directly with sulphuric acid until an indicator changes colour.',
					'Evaporate a lead(II) sulphate solution to dryness because the salt is highly soluble.',
					'Heat lead(II) sulphate until it sublimes and condenses as crystals.',
				],
				'Lead(II) sulphate is insoluble and is prepared by precipitation. Washing removes soluble impurities before drying.',
			),
			q(
				'What gaseous products distinguish acid reacting with a carbonate from acid reacting with a sulphite?',
				'A carbonate releases CO₂; a sulphite releases SO₂.',
				[
					'A carbonate releases SO₂; a sulphite releases CO₂.',
					'Both release H₂ only.',
					'A carbonate releases O₂; a sulphite releases Cl₂.',
				],
				'Carbonates form salt, water and carbon dioxide; sulphites form salt, water and sulphur dioxide.',
			),
			q(
				'Which complete procedure prepares pure dry PbSO₄ from Pb(NO₃)₂(aq) and Na₂SO₄(aq)?',
				'Mix the solutions, filter the PbSO₄ precipitate, wash it with distilled water, and dry it.',
				[
					'Mix the solutions and evaporate the entire mixture so soluble NaNO₃ remains with PbSO₄.',
					'Add excess nitric acid, collect the gas, and crystallise PbSO₄ from the gas.',
					'Filter each reactant before mixing and keep only the two filtrates without precipitation.',
				],
				'Pb(NO₃)₂ + Na₂SO₄ → PbSO₄↓ + 2NaNO₃. Filtration isolates insoluble PbSO₄; washing removes sodium nitrate and drying gives the pure solid.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'analytical-chemistry',
		questions: [
			q(
				'Which observation distinguishes Fe²⁺ from Fe³⁺ after adding sodium hydroxide?',
				'Fe²⁺ gives a dirty green precipitate that turns brown; Fe³⁺ gives a reddish-brown precipitate.',
				[
					'Fe²⁺ gives a light blue precipitate; Fe³⁺ gives a white precipitate soluble in excess.',
					'Both give identical white precipitates that dissolve in excess NaOH.',
					'Fe²⁺ gives no precipitate; Fe³⁺ forms a deep blue solution.',
				],
				'Iron(II) hydroxide is dirty green and oxidises toward brown; iron(III) hydroxide is characteristically reddish-brown.',
			),
			q(
				'What is observed when excess ammonium hydroxide is added to a Cu²⁺ solution?',
				'A light blue precipitate first forms and then dissolves to a deep blue solution.',
				[
					'A dirty green precipitate forms and slowly turns brown.',
					'A white precipitate forms and remains insoluble in excess.',
					'A reddish-brown precipitate dissolves to a colourless solution.',
				],
				'Cu²⁺ initially forms Cu(OH)₂ and, with excess ammonia, forms a soluble deep-blue complex.',
			),
			q(
				'Which behaviour is expected for Zn²⁺ with NaOH and NH₄OH?',
				'A white precipitate forms and dissolves in excess of either reagent.',
				[
					'A white precipitate dissolves in excess NaOH but not in excess NH₄OH.',
					'A light blue precipitate dissolves only in excess NH₄OH.',
					'A dirty green precipitate remains insoluble in both reagents.',
				],
				'Zinc hydroxide is amphoteric and also forms a soluble ammine complex, so the white precipitate dissolves in excess NaOH and NH₄OH.',
			),
			q(
				'Which test result distinguishes Pb²⁺ from Zn²⁺?',
				'The white Pb(OH)₂ precipitate dissolves in excess NaOH but remains insoluble in excess NH₄OH.',
				[
					'The white precipitate dissolves in excess of both NaOH and NH₄OH.',
					'The precipitate is light blue and forms a deep blue solution in NH₄OH.',
					'The precipitate is dirty green and oxidises brown in air.',
				],
				'Both zinc and lead hydroxides dissolve in excess NaOH, but only zinc hydroxide dissolves in excess NH₄OH under the syllabus tests.',
			),
			q(
				'An unknown gives a white precipitate soluble in excess NaOH but insoluble in excess NH₄OH. Which cation is present?',
				'Pb²⁺',
				['Zn²⁺', 'Cu²⁺', 'Fe²⁺'],
				'Pb²⁺ matches the complete two-reagent pattern. Zn²⁺ dissolves in both; Cu²⁺ and Fe²⁺ give coloured precipitates.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'mole-stoichiometry',
		questions: [
			q(
				'How many molecules are present in 0.50 mol of oxygen molecules?',
				'3.011 × 10²³ molecules',
				['6.022 × 10²³ molecules', '1.2044 × 10²⁴ molecules', '3.011 × 10²³ oxygen atoms'],
				'Number of molecules = 0.50 × 6.022 × 10²³ = 3.011 × 10²³. This count is molecules; the number of oxygen atoms would be twice as large.',
				'calculation',
			),
			q(
				'Under the STP convention used in the syllabus, what volume is occupied by 0.25 mol of an ideal gas?',
				'5.6 L',
				['11.2 L', '22.4 L', '89.6 L'],
				'At STP, volume = 0.25 × 22.4 L = 5.6 L. The other values arise from doubling, omitting, or inverting the mole factor.',
				'calculation',
			),
			q(
				'For 2H₂ + O₂ → 2H₂O, how many moles of oxygen are required to react completely with 6 mol of hydrogen?',
				'3 mol O₂',
				['1.5 mol O₂', '6 mol O₂', '12 mol O₂'],
				'The balanced ratio H₂:O₂ is 2:1. Six moles H₂ therefore require 6 × 1/2 = 3 moles O₂.',
				'calculation',
			),
			q(
				'A compound has empirical formula CH₂ and molar mass 56 g mol⁻¹. What is its molecular formula?',
				'C₄H₈',
				['CH₂', 'C₂H₄', 'C₄H₄'],
				'Empirical-formula mass is 14. The multiplier is 56 ÷ 14 = 4, so (CH₂)₄ = C₄H₈.',
				'calculation',
				3,
			),
			q(
				'What mass of oxygen is required to burn 12 g carbon completely according to C + O₂ → CO₂?',
				'32 g O₂',
				['12 g O₂', '16 g O₂', '44 g O₂'],
				'Twelve grams of carbon is 1 mol C. The 1:1 equation requires 1 mol O₂, whose molar mass is 32 g mol⁻¹.',
				'calculation',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'electrolysis',
		questions: [
			q(
				'Which pairing correctly describes ion movement and electron change during electrolysis?',
				'Cations move to the cathode and gain electrons; anions move to the anode and lose electrons.',
				[
					'Cations move to the anode and gain electrons; anions move to the cathode and lose electrons.',
					'Cations move to the cathode and lose electrons; anions move to the anode and gain electrons.',
					'Both ions move to the cathode and exchange protons rather than electrons.',
				],
				'The negative cathode attracts cations, where reduction occurs; the positive anode attracts anions, where oxidation occurs.',
			),
			q(
				'Which factor can change the product discharged during electrolysis of an aqueous solution?',
				'Ion position in the activity series, ion concentration, and whether the electrodes are active or inert.',
				[
					'Only the colour of the electrolyte, regardless of its ions.',
					'Only the total mass of the glass container.',
					'The alphabetical order of ion symbols and electrode names.',
				],
				'Selective discharge is chemical: competing ions, concentration and electrode participation determine products, not apparatus colour or notation.',
			),
			q(
				'What products form during electrolysis of molten lead(II) bromide?',
				'Lead at the cathode and bromine at the anode.',
				[
					'Bromine at the cathode and lead at the anode.',
					'Hydrogen at the cathode and oxygen at the anode.',
					'Lead at both electrodes because only Pb²⁺ carries charge.',
				],
				'Pb²⁺ gains electrons at the cathode to form Pb; Br⁻ loses electrons at the anode to form Br₂. No water is present to supply hydrogen or oxygen.',
			),
			q(
				'For silver electroplating of a spoon, which arrangement is correct?',
				'The spoon is the cathode, silver is the anode, and a soluble silver salt is the electrolyte.',
				[
					'The spoon is the anode, silver is the cathode, and pure water is the electrolyte.',
					'Both spoon and silver are cathodes connected to the same terminal.',
					'The spoon is the cathode, carbon must be the anode, and sodium chloride supplies silver ions.',
				],
				'Metal ions gain electrons and deposit on the cathode object. A silver anode replenishes Ag⁺ in a suitable soluble silver electrolyte.',
			),
			q(
				'Which pair of half-equations is correct for molten PbBr₂?',
				'Cathode: Pb²⁺ + 2e⁻ → Pb; Anode: 2Br⁻ → Br₂ + 2e⁻',
				[
					'Cathode: Pb → Pb²⁺ + 2e⁻; Anode: Br₂ + 2e⁻ → 2Br⁻',
					'Cathode: 2Br⁻ → Br₂ + 2e⁻; Anode: Pb²⁺ + 2e⁻ → Pb',
					'Cathode: Pb²⁺ + e⁻ → Pb⁺; Anode: Br⁻ + e⁻ → Br²⁻',
				],
				'Reduction of Pb²⁺ occurs at the cathode and oxidation of Br⁻ at the anode. The two electrons cancel when the half-equations combine.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'metallurgy',
		questions: [
			q(
				'Which statement correctly distinguishes an ore from a mineral?',
				'An ore is a mineral from which a metal can be extracted conveniently and economically.',
				[
					'Every mineral is automatically an ore, regardless of concentration or cost.',
					'An ore contains only the pure uncombined metal, while a mineral never contains metal.',
					'A mineral is manufactured in a furnace, while an ore occurs only in laboratories.',
				],
				'Ore is an economic subset of mineral: extraction must be practical and worthwhile. Metal-bearing minerals need not all qualify as ores.',
			),
			q(
				'Which comparison of roasting and calcination is correct?',
				'Roasting heats sulphide ore in excess air; calcination heats carbonate or hydrated ore with little or no air.',
				[
					'Roasting treats carbonates without air; calcination treats sulphides in excess air.',
					'Both processes require electrolysis of molten ore and differ only in voltage.',
					'Roasting is physical crushing; calcination is magnetic separation.',
				],
				'Roasting oxidises sulphides in air, whereas calcination thermally decomposes carbonates or hydrated ores with restricted air.',
			),
			q(
				'Why is aluminium extracted electrolytically rather than by reducing Al₂O₃ with carbon?',
				'Aluminium is more reactive than carbon and Al₂O₃ is too stable for carbon reduction.',
				[
					'Aluminium is less reactive than carbon, so it cannot form an oxide.',
					'Carbon reduction would produce only pure aluminium at room temperature.',
					'Al₂O₃ is a gas that cannot contact solid carbon.',
				],
				'Metals above carbon in the activity series have oxides too stable for ordinary carbon reduction and require electrolysis.',
			),
			q(
				'What are the main functions of cryolite in the Hall–Héroult process?',
				'It lowers the operating temperature and improves electrical conductivity of the electrolyte.',
				[
					'It raises the melting point and electrically insulates the alumina.',
					'It reduces Al₂O₃ chemically without any electric current.',
					'It converts aluminium into an insoluble ore at the cathode.',
				],
				'Pure alumina has a very high melting point. Dissolving it in molten cryolite lowers operating temperature and provides a better-conducting melt.',
			),
			q(
				'Which method and electrolyte correctly describe industrial aluminium extraction?',
				'Electrolyse purified alumina dissolved in molten cryolite in the Hall–Héroult cell.',
				[
					'Heat bauxite with coke alone and distil aluminium vapour.',
					'Electrolyse an aqueous aluminium salt so aluminium deposits before hydrogen.',
					'Roast pure aluminium metal in air to obtain molten aluminium at the anode.',
				],
				'Aluminium cannot be reduced economically by carbon or deposited from water. The Hall–Héroult process electrolyses alumina in molten cryolite.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'hydrogen-chloride',
		questions: [
			q(
				'How should dry hydrogen chloride gas be collected in the laboratory?',
				'By downward displacement of air because HCl is denser than air and very soluble in water.',
				[
					'Over water because HCl is almost insoluble in water.',
					'By upward displacement of air because HCl is lighter than air.',
					'By filtration because gas particles are larger than air particles.',
				],
				'Water would absorb HCl. Its greater density allows it to displace air upward as the gas is delivered downward into the jar.',
			),
			q(
				'Why does dry hydrogen chloride gas not change dry blue litmus paper?',
				'Without water, HCl does not ionise to form hydronium ions.',
				[
					'Dry HCl is alkaline and produces hydroxide ions on litmus.',
					'Dry litmus contains excess acid that neutralises HCl.',
					'HCl becomes acidic only after reacting with oxygen, not water.',
				],
				'Acidic colour change requires H₃O⁺ in aqueous conditions. Dry gas and dry indicator provide no water for ionisation.',
			),
			q(
				'What is observed when hydrogen chloride gas meets ammonia gas?',
				'Dense white fumes of ammonium chloride form.',
				['A brown gas of nitrogen dioxide forms.', 'A green gas of chlorine forms.', 'A blue precipitate of copper hydroxide forms.'],
				'HCl + NH₃ → NH₄Cl. The finely divided solid ammonium chloride appears as dense white fumes.',
			),
			q(
				'Which test confirms chloride ions in an appropriately acidified solution?',
				'Add silver nitrate: white AgCl forms and dissolves in ammonium hydroxide.',
				[
					'Add barium chloride: a white precipitate soluble only in concentrated sulphuric acid proves chloride.',
					'Add limewater: milkiness that remains in ammonia proves chloride.',
					'Add sodium hydroxide: a dirty green precipitate proves chloride.',
				],
				'Silver ions precipitate chloride as white AgCl, which dissolves in ammonium hydroxide. The other tests target different ions or gases.',
			),
			q(
				'Which explanation correctly covers both collection and acidity of laboratory HCl gas?',
				'It cannot be collected over water because it is highly soluble, and it reddens blue litmus only when water permits ionisation.',
				[
					'It is collected over water because it is insoluble, and dry HCl releases H₃O⁺ without water.',
					'It cannot be collected over water because it decomposes into H₂ and Cl₂, and acidity comes from chlorine atoms.',
					'It is collected over water only when heated, and dry HCl is acidic because it releases OH⁻.',
				],
				'HCl dissolves extremely readily, preventing water collection. Its aqueous ionisation supplies hydronium ions; dry gas alone does not.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'ammonia',
		questions: [
			q(
				'Which laboratory method correctly prepares and dries ammonia?',
				'Heat an ammonium salt with a strong base and dry the gas using quicklime.',
				[
					'Heat a nitrate with concentrated sulphuric acid and dry the gas using that acid.',
					'React copper with dilute hydrochloric acid and dry the gas using water.',
					'Electrolyse aqueous sodium chloride and dry the gas using phosphorus pentoxide.',
				],
				'Ammonium salts release NH₃ with strong bases. Quicklime removes moisture without reacting with this basic gas; acidic drying agents consume ammonia.',
			),
			q(
				'Which combination of properties determines how ammonia is collected?',
				'It is lighter than air and very soluble in water, so it is collected by downward displacement of air, not over water.',
				[
					'It is denser than air and insoluble in water, so it is collected over water.',
					'It is lighter than air but reacts only with glass, so it is collected by filtration.',
					'It has the same density as air and cannot be collected in a gas jar.',
				],
				'High water solubility rules out collection over water. Being lighter than air, NH₃ rises and displaces air downward.',
			),
			q(
				'Which set of conditions is used in the Haber process?',
				'N₂ and H₂, an iron catalyst, high pressure and a compromise temperature.',
				[
					'NH₃ and O₂, a platinum catalyst, low pressure and room temperature.',
					'N₂ and Cl₂, a copper catalyst, atmospheric pressure and no heating.',
					'NH₄Cl and Ca(OH)₂, sunlight and an electrolytic cell.',
				],
				'The reversible synthesis N₂ + 3H₂ ⇌ 2NH₃ uses iron, raised pressure and a temperature balancing rate and equilibrium yield.',
			),
			q(
				'What happens when ammonia is passed over hot copper(II) oxide?',
				'Ammonia reduces black CuO to copper and is oxidised, producing nitrogen and water.',
				[
					'Ammonia oxidises copper to black CuO and is reduced to hydrogen.',
					'CuO catalyses ammonia formation and remains the only product.',
					'Ammonia forms white NH₄Cl fumes because chloride ions leave CuO.',
				],
				'Ammonia acts as a reducing agent toward hot CuO: copper metal, nitrogen and water form. Chloride is absent, so NH₄Cl cannot form.',
			),
			q(
				'Which equation correctly represents laboratory preparation of ammonia?',
				'2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O',
				['NH₄Cl + Ca(OH)₂ → CaCl₂ + NH₃ + H₂O', '2NH₄Cl + CaO → CaCl₂ + N₂ + 4H₂', 'NH₄Cl + HCl → NH₃ + Cl₂ + H₂'],
				'The 2:1:1:2:2 coefficients conserve calcium, chlorine, nitrogen, oxygen and hydrogen. The alternatives are atomically unbalanced or chemically incorrect.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'nitric-acid',
		questions: [
			q(
				'Which reagents are used to prepare nitric acid in the laboratory?',
				'An alkali-metal nitrate and concentrated sulphuric acid.',
				[
					'An alkali-metal chloride and dilute nitric acid.',
					'Ammonium chloride and calcium hydroxide.',
					'Copper metal and dilute hydrochloric acid.',
				],
				'Concentrated H₂SO₄, being less volatile, displaces volatile HNO₃ from a nitrate. The other pairs prepare different products.',
			),
			q(
				'Which sequence represents the main chemical stages of the Ostwald process?',
				'NH₃ is oxidised to NO, NO to NO₂, and NO₂ is absorbed with water and oxygen to form HNO₃.',
				[
					'N₂ is reduced to NH₃, which is absorbed directly to form HNO₃ without oxygen.',
					'NO₂ is reduced to NO, then decomposed into N₂ and H₂O.',
					'A nitrate is electrolysed to HNO₃ with no gaseous intermediate.',
				],
				'Industrial manufacture starts with catalytic ammonia oxidation, followed by NO oxidation and absorption of NO₂ to produce nitric acid.',
			),
			q(
				'Why does nitric acid usually not liberate hydrogen when it reacts with a metal?',
				'Its strong oxidising action converts nascent hydrogen to water while the acid is reduced to nitrogen oxides.',
				[
					'All metals are below hydrogen in the activity series.',
					'Nitric acid contains no hydrogen atoms that could form hydrogen gas.',
					'Metals do not react with any acid unless chloride ions are present.',
				],
				'Nitric acid is both acidic and strongly oxidising. Hydrogen that might otherwise form is oxidised, while nitrate is reduced to nitrogen oxides.',
			),
			q(
				'Why can concentrated nitric acid appear not to react further with iron at room temperature?',
				'It forms a thin protective oxide layer that passivates the iron.',
				[
					'It changes iron into an inert noble gas.',
					'It removes all iron atoms from the surface by sublimation.',
					'It permanently neutralises itself into pure water before touching iron.',
				],
				'Passivation is kinetic protection by an adherent oxide film. The metal is not transformed into a noble element, and the acid is not neutralised first.',
			),
			q(
				'Why is the laboratory mixture kept below about 200 °C while nitric acid is distilled from a nitrate?',
				'To limit HNO₃ decomposition and contamination by nitrogen dioxide, producing purer acid.',
				[
					'To freeze nitric acid before it can enter the receiver.',
					'To prevent the nitrate from reacting at all, leaving only water to distil.',
					'To convert concentrated sulphuric acid into ammonia gas.',
				],
				'Excessive heating decomposes nitric acid and introduces brown NO₂. Controlled heating supports safer distillation and a purer condensate.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'sulphuric-acid',
		questions: [
			q(
				'Which equation and catalyst describe the central reversible step of the Contact process?',
				'2SO₂ + O₂ ⇌ 2SO₃, catalysed by V₂O₅.',
				['SO₂ + H₂O ⇌ H₂SO₄, catalysed by iron.', '2SO₃ ⇌ 2S + 3O₂, catalysed by chlorine.', 'H₂ + SO₂ ⇌ H₂S + O₂, catalysed by copper.'],
				'The Contact process oxidises sulphur dioxide reversibly to sulphur trioxide over vanadium(V) oxide under compromise conditions.',
			),
			q(
				'Why is SO₃ first absorbed in concentrated H₂SO₄ instead of directly in water?',
				'Direct hydration is highly exothermic and forms a difficult-to-condense sulphuric acid mist.',
				[
					'SO₃ is completely insoluble in water and cannot react with it.',
					'Water reduces SO₃ to elemental sulphur before any acid can form.',
					'Concentrated H₂SO₄ neutralises SO₃ into a harmless gas that is discarded.',
				],
				'SO₃ is absorbed to make oleum, which can be diluted controllably. Direct addition to water produces hazardous fine acid droplets.',
			),
			q(
				'Which comparison of dilute and concentrated sulphuric acid is correct?',
				'Dilute acid shows ordinary acidic reactions; concentrated acid can additionally act as an oxidising and dehydrating agent.',
				[
					'Dilute acid is a stronger dehydrating agent, while concentrated acid is chemically inert.',
					'Only dilute acid contains hydrogen, so concentrated acid cannot form sulphates.',
					'Concentrated acid is a base because it removes water from substances.',
				],
				'Concentration changes important behaviour: concentrated H₂SO₄ has strong oxidising and water-removing actions in addition to acid chemistry.',
			),
			q(
				'Which observation confirms sulphate ions after appropriate acidification?',
				'A soluble barium salt produces a white insoluble BaSO₄ precipitate.',
				[
					'Silver nitrate produces white AgCl that proves sulphate.',
					'Limewater turns milky because sulphate releases CO₂.',
					'Sodium hydroxide produces a dirty green precipitate in every sulphate.',
				],
				'Ba²⁺ + SO₄²⁻ → BaSO₄ forms a characteristic white insoluble precipitate. Acidification prevents misleading carbonate or sulphite precipitates.',
			),
			q(
				'Which industrial sequence correctly converts SO₃ into usable sulphuric acid?',
				'Absorb SO₃ in concentrated H₂SO₄ to form oleum, then dilute the oleum carefully.',
				[
					'Bubble SO₃ rapidly into cold water to collect dry H₂SO₄ crystals.',
					'Reduce SO₃ with carbon to sulphur, then dissolve sulphur in water.',
					'Absorb SO₃ in sodium hydroxide and distil sulphuric acid directly from sodium sulphate.',
				],
				'Oleum formation avoids the uncontrollable acid mist produced by direct hydration. Controlled dilution then gives the required acid concentration.',
				'concept_check',
				3,
			),
		],
	},
	{
		classLevel: 'X',
		slug: 'organic-chemistry',
		questions: [
			q(
				'Which feature defines members of the same homologous series?',
				'They share a functional group and general formula, and adjacent members differ by CH₂.',
				[
					'They have identical molecular formulae but unrelated functional groups.',
					'Adjacent members differ by one carbon atom only, with no hydrogen difference.',
					'They all have the same boiling point and physical state.',
				],
				'A homologous series preserves functional chemistry while increasing chain length in CH₂ steps; physical properties change progressively.',
			),
			q(
				'Which observation distinguishes ethene from ethane?',
				'Ethene decolourises bromine solution by addition; ethane does not under the same conditions.',
				[
					'Ethane decolourises bromine solution by addition; ethene is unreactive.',
					'Both instantly decolourise bromine because all carbon compounds are unsaturated.',
					'Ethene turns bromine solution deeper brown because it removes hydrogen.',
				],
				'Ethene contains a reactive C=C bond and adds bromine. Saturated ethane does not undergo that test reaction without special conditions.',
			),
			q(
				'Which pair consists of structural isomers?',
				'Butane and 2-methylpropane, both C₄H₁₀.',
				['Ethane C₂H₆ and ethene C₂H₄.', 'Ethanol C₂H₅OH and ethanoic acid CH₃COOH.', 'Methane CH₄ and chloromethane CH₃Cl.'],
				'Isomers must share a molecular formula but differ in connectivity. Butane and 2-methylpropane meet both conditions.',
			),
			q(
				'Which products form when ethanol reacts with ethanoic acid in the presence of concentrated sulphuric acid?',
				'Ethyl ethanoate and water.',
				['Ethene and hydrogen only.', 'Methane and carbon dioxide.', 'Sodium ethanoate and oxygen.'],
				'An alcohol and carboxylic acid undergo esterification to produce an ester and water; here the ester is ethyl ethanoate.',
			),
			q(
				'What is the correct name of CH₃CH₂CH₂OH, and what forms on controlled oxidation?',
				'Propan-1-ol; propanoic acid.',
				['Propan-2-ol; propanone.', 'Propanal; propan-1-ol.', 'Ethyl methanol; ethanoic acid.'],
				'The longest chain has three carbons and the terminal hydroxyl group is at carbon 1. A primary alcohol oxidises to the corresponding carboxylic acid.',
				'concept_check',
				3,
			),
		],
	},
];
