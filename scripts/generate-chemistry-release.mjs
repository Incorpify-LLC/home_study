import process from 'node:process';
import { writeFileSync } from 'node:fs';
import { URL as NodeURL } from 'node:url';

const official = {
	VIII: {
		id: 'src-cisce-upper-primary-math',
		url: 'https://cisce.org/wp-content/uploads/2025/03/UpperPrimary.pdf',
	},
	X: {
		id: 'src-cisce-icse-chemistry-2027',
		url: 'https://cisce.org/wp-content/uploads/2025/03/11.-Chemistry.pdf',
	},
};

const chapters = [
	{
		classLevel: 'VIII',
		slug: 'matter',
		title: 'Matter',
		unit: 'Matter',
		minutes: 40,
		objective: 'Use kinetic molecular theory to explain states and changes of state, and apply the law of conservation of mass.',
		overview:
			'Matter is anything that has mass and occupies space. The kinetic molecular theory explains matter as tiny particles in constant motion. Solid particles are closely packed and mainly vibrate about fixed positions; liquid particles remain close but can slide past one another; gas particles are far apart and move freely. Heating raises average kinetic energy, weakens the effect of attraction and can cause melting or vaporisation, while cooling reverses these changes. During particle collisions, energy may be transferred without creating or destroying matter. The law of conservation of mass states that total mass remains unchanged in a physical or chemical change when every reactant, product and participating atmospheric gas is included. A reaction in a closed vessel demonstrates this clearly because no material can enter or escape.',
		points: [
			'Particles of matter are in continuous motion, and their average kinetic energy rises when temperature rises.',
			'Solids have the least inter-particle space and strongest effective attraction; gases have the greatest space and weakest attraction.',
			'Changes of state alter particle arrangement and energy but do not change the chemical identity of a pure substance.',
			'In a closed system, total mass of reactants equals total mass of products, including any gas that participates in the reaction.',
		],
		worked: [
			'A sealed flask contains 20.8 g of barium chloride solution and a small tube containing 14.2 g of sodium sulphate solution. The solutions are mixed without opening the flask. What mass should the flask contents have after the reaction?',
			[
				'Add the masses present before mixing: 20.8 g + 14.2 g = 35.0 g.',
				'The reaction forms a precipitate, but the flask remains closed and no matter enters or leaves.',
				'By conservation of mass, the contents still have a total mass of 35.0 g.',
			],
			'35.0 g',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'physical-chemical-changes',
		title: 'Physical and Chemical Changes',
		unit: 'Changes in Matter',
		minutes: 35,
		objective: 'Distinguish physical and chemical changes using observable evidence, reversibility and formation of new substances.',
		overview:
			'Changes around us may be slow or fast, reversible or irreversible, periodic or non-periodic. A physical change alters state, size or shape without producing a substance with a new chemical composition; melting ice, dissolving sugar and stretching a spring are examples. A chemical change rearranges atoms to form one or more new substances with properties different from the starting materials. Useful evidence includes a lasting colour change, gas evolution, precipitate formation, light or heat not supplied from outside, or a new odour, although no single observation alone is always conclusive. Rusting, combustion and curdling are chemical changes. Reversibility is a helpful clue but not the definition: some physical changes are difficult to reverse, while some chemical reactions can be reversed under suitable conditions. Classification must therefore focus on whether new substances form.',
		points: [
			'A physical change preserves chemical composition even when state, size, shape or appearance changes.',
			'A chemical change forms new substance or substances through rearrangement of atoms and chemical bonds.',
			'Gas evolution, precipitate formation, persistent colour change and unexpected energy change are common evidence of reaction.',
			'Reversibility alone does not define a physical change; the decisive question is whether chemical composition changes.',
		],
		worked: [
			'Classify melting candle wax and burning candle vapour, and justify each classification.',
			[
				'Melting changes solid wax to liquid wax without changing its composition, so it is physical.',
				'Near the wick, wax vapour reacts with oxygen and forms carbon dioxide and water.',
				'Because burning forms new substances, combustion is chemical even though melting and burning occur together.',
			],
			'Melting is physical; burning is chemical.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'elements-compounds-mixtures',
		title: 'Elements, Compounds and Mixtures',
		unit: 'Classification and Separation',
		minutes: 45,
		objective: 'Classify substances and choose separation methods from differences in physical properties.',
		overview:
			'An element contains one kind of atom and cannot be decomposed by ordinary chemical methods. A compound contains atoms of two or more elements chemically combined in a fixed ratio, and its properties differ from those of its elements. A mixture contains substances physically combined in variable proportions; each component largely retains its properties and can be separated physically. Separation depends on a measurable property difference. Filtration separates an insoluble solid from a liquid, evaporation recovers a dissolved solid, crystallisation obtains purer crystals, sublimation separates a volatile solid, a separating funnel handles immiscible liquids, and chromatography separates dissolved substances by unequal movement between phases. Distillation separates a solvent or liquids using different boiling points, while fractional distillation is preferred when boiling points are close. The method must match the mixture rather than being chosen by habit.',
		points: [
			'Elements contain one kind of atom; compounds contain elements chemically combined in fixed proportions.',
			'Mixtures have variable composition and usually retain the properties of their components.',
			'A separation technique is selected from differences in solubility, particle size, density, magnetism, sublimation or boiling point.',
			'Chromatography separates soluble components because they travel at different rates between stationary and mobile phases.',
		],
		worked: [
			'Design a sequence to separate iron filings, ammonium chloride and sand from one dry mixture.',
			[
				'Use a magnet to remove the magnetic iron filings.',
				'Heat the remaining mixture gently under an inverted funnel so ammonium chloride sublimes and deposits on the cool surface.',
				'The non-subliming sand remains in the dish and is collected after cooling.',
			],
			'Magnetic separation, then sublimation, leaving sand.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'atomic-structure',
		title: 'Atomic Structure',
		unit: 'Atoms',
		minutes: 45,
		objective: 'Describe subatomic particles, atomic and mass numbers, isotopes and electronic arrangements of the first twenty elements.',
		overview:
			'Atoms contain a tiny, dense nucleus made of positively charged protons and neutral neutrons, surrounded by negatively charged electrons arranged in shells. Atomic number is the number of protons and identifies the element; a neutral atom has the same number of electrons. Mass number is the total number of protons and neutrons, so neutrons equal mass number minus atomic number. Electrons fill shells in simple arrangements for the first twenty elements, commonly represented as 2, 8, 8, 2. Valence electrons occupy the outermost shell and strongly influence chemical behaviour. Isotopes are atoms of the same element with equal atomic number but different neutron and mass numbers. They have nearly identical chemical properties but different masses and sometimes different nuclear stability. Ions form when atoms lose or gain electrons; the nucleus does not change during ordinary ion formation.',
		points: [
			'Atomic number equals proton number and, for a neutral atom, electron number; mass number equals protons plus neutrons.',
			'Electrons occupy shells, and the outermost-shell electrons are called valence electrons.',
			'Isotopes have the same atomic number but different mass numbers because their neutron counts differ.',
			'Cations form by electron loss and anions by electron gain; ordinary chemical changes do not alter the nucleus.',
		],
		worked: [
			'An atom has atomic number 17 and mass number 37. Find its protons, electrons, neutrons and shell arrangement.',
			[
				'Atomic number 17 means 17 protons and, because the atom is neutral, 17 electrons.',
				'Neutrons = mass number − atomic number = 37 − 17 = 20.',
				'Distribute 17 electrons into shells: 2 in the first, 8 in the second and 7 in the third.',
			],
			'17 protons, 17 electrons, 20 neutrons; 2,8,7.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'language-of-chemistry',
		title: 'Language of Chemistry',
		unit: 'Symbols and Formulae',
		minutes: 45,
		objective: 'Use symbols, valencies, formulae and balanced equations to represent substances and reactions.',
		overview:
			'Chemistry uses symbols for elements and formulae for molecules and ionic compounds. A symbol begins with a capital letter and may have a lower-case second letter. Valency describes combining capacity: sodium has valency one, oxygen two and aluminium three. Formulae are constructed so total positive and negative valencies balance, simplifying subscripts to the lowest whole-number ratio. Polyatomic ions such as ammonium, hydroxide, nitrate, carbonate and sulphate behave as units and require brackets when more than one is present. A chemical equation identifies reactants and products; coefficients are adjusted to conserve each kind of atom. Subscripts must never be changed while balancing because that would change the substance itself. State symbols and conditions add meaning: (s), (l), (g), (aq), heat, pressure or catalyst. A balanced equation expresses conservation of atoms and supports quantitative reasoning.',
		points: [
			'Element symbols have a capital first letter; formula subscripts show the simplest whole-number ratio of atoms or ions.',
			'Valencies or ionic charges must balance to make an electrically neutral compound.',
			'Polyatomic ions remain intact in many formulae and are enclosed in brackets when a subscript applies to the whole ion.',
			'Equations are balanced by changing coefficients, never the subscripts inside correct chemical formulae.',
		],
		worked: [
			'Write the formula of aluminium sulphate and balance its formation from aluminium and sulphuric acid.',
			[
				'Aluminium is Al³⁺ and sulphate is SO₄²⁻; balancing charges gives Al₂(SO₄)₃.',
				'Start with Al + H₂SO₄ → Al₂(SO₄)₃ + H₂.',
				'Balance aluminium, sulphate and hydrogen to obtain 2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂.',
			],
			'Al₂(SO₄)₃; 2Al + 3H₂SO₄ → Al₂(SO₄)₃ + 3H₂.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'chemical-reactions',
		title: 'Chemical Reactions',
		unit: 'Reactions',
		minutes: 45,
		objective: 'Recognise reaction types, energy changes, catalysts and balanced chemical equations.',
		overview:
			'A chemical reaction converts reactants into products by breaking and forming bonds while conserving atoms. In combination reactions, substances join to form one main product; decomposition reactions split a compound using heat, light or electricity. Displacement occurs when a more reactive element replaces a less reactive one, while double displacement exchanges ions and may produce a precipitate, gas or water. Exothermic reactions transfer energy to the surroundings, often warming them, whereas endothermic reactions absorb energy. Oxidation can be described as gain of oxygen or loss of hydrogen, and reduction as loss of oxygen or gain of hydrogen; these paired processes occur together. A catalyst changes reaction rate without being consumed overall. Conditions such as temperature, concentration, surface area and catalysts affect rate because they change the frequency or effectiveness of particle collisions. Equations should include observations and necessary conditions.',
		points: [
			'Combination, decomposition, displacement and double-displacement reactions classify common patterns of chemical change.',
			'A more reactive element can displace a less reactive element from its compound.',
			'Exothermic reactions release energy to the surroundings; endothermic reactions absorb energy from them.',
			'A catalyst changes reaction rate while being regenerated, and reaction rate also depends on temperature, concentration and surface area.',
		],
		worked: [
			'Classify and balance the reaction in which zinc is added to copper sulphate solution.',
			[
				'Zinc is more reactive than copper, so it replaces copper from copper sulphate.',
				'The word equation is zinc + copper sulphate → zinc sulphate + copper.',
				'The formula equation Zn + CuSO₄ → ZnSO₄ + Cu is already balanced in a 1:1:1:1 ratio.',
			],
			'A displacement reaction: Zn + CuSO₄ → ZnSO₄ + Cu.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'hydrogen',
		title: 'Hydrogen',
		unit: 'Study of Elements',
		minutes: 40,
		objective: 'Explain laboratory preparation, properties, tests and important uses of hydrogen.',
		overview:
			'Hydrogen is the lightest element and commonly exists as diatomic H₂. In the laboratory it can be prepared by reacting a moderately reactive metal such as zinc with dilute hydrochloric or sulphuric acid. The first gas is allowed to escape because it contains air and an explosive hydrogen–air mixture. Hydrogen is colourless, odourless, almost insoluble in water and much less dense than air, so it may be collected over water. A lighted splint gives the characteristic pop test. Hydrogen burns in oxygen with a pale blue flame to form water and releases considerable energy. It also acts as a reducing agent by removing oxygen from heated oxides of less reactive metals, such as copper(II) oxide. Important uses include manufacture of ammonia, hydrogenation of vegetable oils, oxy-hydrogen flames and emerging fuel cells. Safe handling requires keeping hydrogen away from sparks and avoiding untested mixtures with air.',
		points: [
			'Laboratory hydrogen is commonly prepared from zinc and a dilute non-oxidising acid and collected over water.',
			'The first portion is discarded to remove air; pure hydrogen burns with a pale blue flame and gives a pop with a lighted splint.',
			'Hydrogen reduces heated copper(II) oxide to copper and is itself oxidised to water.',
			'Hydrogen is used in ammonia manufacture, oil hydrogenation, high-temperature flames and fuel cells.',
		],
		worked: [
			'Write the equation for preparing hydrogen from zinc and dilute hydrochloric acid, and state one safety precaution.',
			[
				'Zinc displaces hydrogen from dilute hydrochloric acid.',
				'Balance atoms to obtain Zn + 2HCl → ZnCl₂ + H₂.',
				'Let the first gas escape before ignition because it may contain an explosive mixture of hydrogen and air.',
			],
			'Zn + 2HCl → ZnCl₂ + H₂; discard the first gas.',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'water',
		title: 'Water',
		unit: 'Water',
		minutes: 45,
		objective: 'Explain solutions, solubility, water of crystallisation, hardness and common purification methods.',
		overview:
			'Water is a polar solvent that dissolves many ionic and molecular substances, but not every substance. A solution contains a solute uniformly dispersed in a solvent. Solubility is the maximum mass of solute that dissolves in a stated mass of solvent at a specified temperature to form a saturated solution. For most solids solubility increases with temperature, while gases generally become less soluble as temperature rises. Crystals may include water of crystallisation in a fixed ratio, as in hydrated copper(II) sulphate. Hard water contains dissolved calcium or magnesium ions and forms scum instead of a quick lather with soap. Temporary hardness due mainly to hydrogencarbonates can be removed by boiling; permanent hardness caused by chlorides or sulphates needs washing soda, ion exchange or distillation. Sedimentation, filtration, chlorination and boiling address different impurities, so safe treatment uses the method suited to the contamination.',
		points: [
			'Solubility is measured at a stated temperature, and a saturated solution cannot dissolve more solute under those conditions.',
			'Most solid solutes become more soluble on heating, while gases usually become less soluble.',
			'Temporary hardness can be removed by boiling; permanent hardness requires methods such as washing soda, ion exchange or distillation.',
			'Purification methods remove different hazards: filtration removes suspended solids, while boiling or disinfection controls microorganisms.',
		],
		worked: [
			'At 40 °C, 65 g of a salt dissolves in 100 g of water. How much dissolves in 250 g of water at the same temperature?',
			[
				'Set a proportion because temperature and solvent are unchanged: 65 g salt per 100 g water.',
				'For 250 g water, mass = 65 × 250 ÷ 100.',
				'Calculate 162.5 g of salt.',
			],
			'162.5 g',
		],
	},
	{
		classLevel: 'VIII',
		slug: 'carbon-compounds',
		title: 'Carbon and its Compounds',
		unit: 'Carbon',
		minutes: 45,
		objective: 'Relate carbon allotropes and simple carbon compounds to their structures, properties and environmental effects.',
		overview:
			'Carbon is unusual because each atom forms four covalent bonds and can link to other carbon atoms, producing a vast range of compounds. It occurs in crystalline allotropes such as diamond and graphite and in amorphous forms such as coal, coke and charcoal. Diamond has a rigid three-dimensional network, making it extremely hard and an electrical insulator. Graphite has layered sheets with mobile electrons, so it is soft, slippery and electrically conducting. Carbon burns in sufficient oxygen to form carbon dioxide; limited oxygen can produce poisonous carbon monoxide. Carbon dioxide is colourless, denser than air, turns limewater milky and does not support ordinary combustion. It is needed for photosynthesis but excessive atmospheric carbon dioxide strengthens the greenhouse effect. Carbon monoxide binds strongly to haemoglobin and prevents oxygen transport. Fuels must therefore burn with adequate ventilation, and charcoal is useful in adsorption because of its porous surface.',
		points: [
			'Carbon is tetravalent and shows catenation, allowing stable chains, branches and rings.',
			'Diamond is a hard three-dimensional covalent network; graphite has conducting layers that slide over one another.',
			'Complete combustion forms carbon dioxide, while incomplete combustion may form highly poisonous carbon monoxide.',
			'Carbon dioxide supports photosynthesis and contributes to warming in excess; activated charcoal adsorbs substances on its porous surface.',
		],
		worked: [
			'A burner shows a yellow, smoky flame in a closed kitchen. Explain the danger and the immediate correction.',
			[
				'The yellow smoky flame indicates incomplete combustion because too little oxygen reaches the fuel.',
				'Incomplete combustion can produce carbon monoxide, which blocks oxygen transport in blood.',
				'Turn off the burner, ventilate the room and restore a clear air inlet before reuse.',
			],
			'Risk of carbon monoxide; stop, ventilate and improve the air supply.',
		],
	},
	{
		classLevel: 'X',
		slug: 'periodic-properties',
		title: 'Periodic Table, Periodic Properties and Variations of Properties',
		unit: 'Periodic Properties',
		minutes: 50,
		objective: 'Explain periodic trends through nuclear charge, shells and valence electrons for elements through calcium.',
		overview:
			'The modern periodic law states that the physical and chemical properties of elements are periodic functions of atomic number. Elements are arranged in periods according to occupied electron shells and in groups according to related valence-shell configurations. Across a period, nuclear charge rises while electrons enter the same principal shell, so atomic size generally decreases, ionisation potential and electronegativity generally increase, and metallic character decreases. Down a group, additional shells increase size and shielding, so ionisation potential and electronegativity generally decrease while metallic character increases. Electron affinity and non-metallic character show corresponding trends with qualifications. Alkali metals readily lose one electron and become more reactive down the group; halogens tend to gain one electron, with reactivity generally decreasing down their group. Trends are explanations, not isolated arrows: effective nuclear attraction and shell structure must support every prediction.',
		points: [
			'Modern periodic law relates recurring properties to atomic number, and group similarity arises from related valence-electron arrangements.',
			'Across a period atomic size and metallic character generally decrease, while ionisation potential and electronegativity generally increase.',
			'Down a group atomic size and metallic character generally increase because new shells and shielding reduce nuclear attraction on valence electrons.',
			'Alkali metals become more reactive down Group 1, whereas halogens generally become less reactive down Group 17.',
		],
		worked: [
			'Compare sodium and chlorine in Period 3 for atomic size, metallic character and electronegativity.',
			[
				'Both have three occupied shells, but chlorine has a much larger nuclear charge.',
				'The stronger attraction in chlorine pulls its electron cloud closer, so chlorine is smaller.',
				'Sodium is more metallic and less electronegative; chlorine is less metallic and more electronegative.',
			],
			'Na is larger and more metallic; Cl is smaller and more electronegative.',
		],
	},
	{
		classLevel: 'X',
		slug: 'chemical-bonding',
		title: 'Chemical Bonding',
		unit: 'Bonding',
		minutes: 55,
		objective: 'Represent electrovalent, covalent and coordinate bonds and connect bonding with properties.',
		overview:
			'Atoms bond to achieve more stable outer-electron arrangements. Electrovalent or ionic bonding involves electron transfer followed by attraction between oppositely charged ions, as in sodium chloride, magnesium chloride and calcium oxide. Ionic compounds form crystal lattices, have high melting points and conduct electricity only when molten or dissolved because ions must be mobile. Covalent bonds form when atoms share electron pairs. Non-polar molecules share approximately equally, while polar covalent bonds arise from unequal attraction caused by electronegativity differences, as in hydrogen chloride, ammonia and water. Covalent substances often have lower melting and boiling points and usually do not conduct electricity, although structure matters. A coordinate bond is a shared pair supplied entirely by one atom, illustrated when ammonia donates its lone pair to H⁺ to form NH₄⁺ or water forms H₃O⁺. Electron-dot diagrams must show valence electrons and the origin of shared or transferred pairs accurately.',
		points: [
			'Ionic bonding transfers electrons and produces oppositely charged ions held in a lattice.',
			'Ionic compounds conduct when molten or aqueous because ions are mobile, but not as solids where ions are fixed.',
			'Covalent bonding shares electron pairs; unequal sharing creates polar covalent molecules.',
			'In a coordinate bond both electrons in the shared pair are donated by one atom, as in NH₄⁺ and H₃O⁺.',
		],
		worked: [
			'Explain why solid sodium chloride does not conduct but molten sodium chloride does.',
			[
				'Current requires charged particles that can move through the material.',
				'In solid NaCl, Na⁺ and Cl⁻ ions are locked in fixed lattice positions.',
				'Melting frees the ions to migrate to electrodes, so the molten compound conducts.',
			],
			'Ions are fixed in the solid but mobile in the melt.',
		],
	},
	{
		classLevel: 'X',
		slug: 'acids-bases-salts',
		title: 'Acids, Bases and Salts',
		unit: 'Acids, Bases and Salts',
		minutes: 55,
		objective: 'Apply ionic definitions, indicators, pH, salt classification and preparation methods with balanced equations.',
		overview:
			'Acids ionise in water to produce hydronium ions, while alkalis dissociate to provide hydroxide ions. Their properties therefore appear in aqueous solution. Indicators respond over characteristic pH ranges: acids turn blue litmus red, alkalis turn red litmus blue, methyl orange is red in acid and yellow in alkali, and phenolphthalein is colourless in acid but pink in alkali. The pH scale expresses acidity or alkalinity, with 7 neutral under ordinary conditions. Salts form when acidic hydrogen is partly or completely replaced by a metal or ammonium ion and may be normal, acid, basic or complex. Preparation depends on solubility and reactant type: direct combination, displacement, precipitation, neutralisation, titration, or acid action on carbonates. Acids decompose carbonates and hydrogencarbonates to release carbon dioxide and react with suitable sulphides or sulphites to release characteristic gases. Correct equations must show ionisation, conditions and observations.',
		points: [
			'Acids produce H₃O⁺ in water and alkalis produce OH⁻; indicators and pH reveal the resulting solution conditions.',
			'A salt results from partial or complete replacement of ionisable hydrogen in an acid by a metal or ammonium ion.',
			'Insoluble salts are commonly prepared by precipitation; soluble salts may use neutralisation, titration or acid reactions.',
			'Acid plus carbonate gives salt, water and carbon dioxide, while acid plus sulphite releases sulphur dioxide.',
		],
		worked: [
			'Choose a method to prepare pure dry lead(II) sulphate from soluble reagents.',
			[
				'Lead(II) sulphate is insoluble, so use precipitation.',
				'Mix lead(II) nitrate solution with sodium sulphate solution: Pb(NO₃)₂ + Na₂SO₄ → PbSO₄↓ + 2NaNO₃.',
				'Filter the precipitate, wash it with distilled water and dry it.',
			],
			'Precipitation, followed by filtration, washing and drying.',
		],
	},
	{
		classLevel: 'X',
		slug: 'analytical-chemistry',
		title: 'Analytical Chemistry',
		unit: 'Qualitative Analysis',
		minutes: 50,
		objective: 'Identify selected cations from precipitate colours and behaviour with sodium and ammonium hydroxides.',
		overview:
			'Qualitative analysis identifies ions through reproducible observations. Solutions of iron, copper, zinc and lead salts may be tested with sodium hydroxide and ammonium hydroxide added first dropwise and then in excess. Iron(II) gives a dirty green hydroxide precipitate that slowly turns brown on oxidation, while iron(III) gives a reddish-brown precipitate. Copper(II) gives a light blue precipitate; in excess ammonium hydroxide it dissolves to form a deep inky-blue solution. Zinc gives a white gelatinous precipitate soluble in excess sodium hydroxide and also in excess ammonium hydroxide. Lead gives a white precipitate soluble in excess sodium hydroxide but not in excess ammonium hydroxide. Amphoteric aluminium, zinc and lead oxides or hydroxides react with strong alkalis as well as acids. A conclusion must follow the complete sequence of colour and solubility observations rather than one colour viewed in isolation.',
		points: [
			'Fe²⁺ gives dirty green Fe(OH)₂ that oxidises brown; Fe³⁺ gives reddish-brown Fe(OH)₃.',
			'Cu²⁺ gives light blue Cu(OH)₂ and a deep blue solution in excess ammonium hydroxide.',
			'Zn²⁺ gives a white precipitate soluble in excess NaOH and excess NH₄OH.',
			'Pb²⁺ gives a white precipitate soluble in excess NaOH but insoluble in excess NH₄OH.',
		],
		worked: [
			'An unknown solution gives a white precipitate with NaOH that dissolves in excess, but its white precipitate with NH₄OH does not dissolve in excess. Identify the cation.',
			[
				'Solubility in excess NaOH suggests an amphoteric hydroxide such as zinc or lead.',
				'Zinc hydroxide also dissolves in excess NH₄OH, but the observed precipitate does not.',
				'The pattern therefore identifies Pb²⁺.',
			],
			'Pb²⁺ (lead(II)).',
		],
	},
	{
		classLevel: 'X',
		slug: 'mole-stoichiometry',
		title: 'Mole Concept and Stoichiometry',
		unit: 'Quantitative Chemistry',
		minutes: 60,
		objective: 'Use the mole, Avogadro constant, gas volume laws, formula calculations and balanced equations quantitatively.',
		overview:
			'A mole is the amount containing Avogadro’s number, 6.022 × 10²³, of specified particles. One mole of atoms has a mass numerically equal to relative atomic mass in grams, and one mole of molecules has a mass equal to relative molecular mass in grams. At standard temperature and pressure in the syllabus convention, one mole of gas occupies 22.4 litres. Avogadro’s law states that equal volumes of gases at the same temperature and pressure contain equal numbers of molecules. Gay-Lussac’s law shows that reacting gas volumes and gaseous products occur in simple whole-number ratios under the same conditions. Vapour density is half relative molecular mass. Empirical formula gives the simplest atom ratio, while molecular formula is a whole-number multiple determined from molar mass. Balanced equations provide mole ratios for converting masses, gas volumes and particle counts, with units and limiting information checked before calculation.',
		points: [
			'One mole contains 6.022 × 10²³ entities and has mass equal to the relative atomic or molecular mass expressed in grams.',
			'At STP, one mole of gas occupies 22.4 L under the convention used in this syllabus.',
			'A balanced equation gives mole ratios that connect reactant and product masses, volumes and particle numbers.',
			'Empirical formula is the simplest ratio; molecular formula is an integer multiple fixed by molar mass.',
		],
		worked: [
			'Calculate the mass of oxygen needed to burn 12 g of carbon completely: C + O₂ → CO₂.',
			[
				'Moles of carbon = 12 g ÷ 12 g mol⁻¹ = 1 mol.',
				'The equation shows 1 mol C reacts with 1 mol O₂.',
				'One mole of O₂ has mass 32 g, so 32 g oxygen is required.',
			],
			'32 g O₂.',
		],
	},
	{
		classLevel: 'X',
		slug: 'electrolysis',
		title: 'Electrolysis',
		unit: 'Electrochemistry',
		minutes: 60,
		objective: 'Explain ion migration, selective discharge, electrode reactions and applications of electrolysis.',
		overview:
			'Electrolysis is chemical decomposition caused by electric current through an electrolyte. Electrolytes contain mobile ions when molten or in aqueous solution; non-electrolytes do not provide ions. The cathode is connected to the negative terminal and attracts cations, where reduction by electron gain occurs. The anode is positive and attracts anions, where oxidation by electron loss occurs. Products depend on the ions present, their discharge tendencies, concentration and electrode material. Molten lead bromide yields lead at the cathode and bromine at the anode. Acidified water with inert electrodes yields hydrogen and oxygen, while aqueous copper(II) sulphate behaves differently with platinum and copper electrodes. Electroplating deposits a metal coating: the object is cathode, coating metal is usually anode, and electrolyte supplies coating-metal ions. Electrorefining transfers pure copper to the cathode while less reactive impurities form anode mud. Every analysis should state electrolyte, electrodes, ions, half-equations and observations.',
		points: [
			'Cations move to the cathode and gain electrons; anions move to the anode and lose electrons.',
			'Selective discharge depends on ion position in the activity series, concentration and whether electrodes are inert or active.',
			'Molten lead bromide produces Pb at the cathode and Br₂ at the anode.',
			'In electroplating the article is cathode, the coating metal is generally anode and a soluble salt supplies metal ions.',
		],
		worked: [
			'State the electrode reactions during electrolysis of molten lead bromide.',
			[
				'Molten PbBr₂ contains mobile Pb²⁺ and Br⁻ ions.',
				'At the cathode, Pb²⁺ gains electrons: Pb²⁺ + 2e⁻ → Pb.',
				'At the anode, bromide loses electrons: 2Br⁻ → Br₂ + 2e⁻.',
			],
			'Lead forms at the cathode and bromine at the anode.',
		],
	},
	{
		classLevel: 'X',
		slug: 'metallurgy',
		title: 'Metallurgy',
		unit: 'Metals',
		minutes: 60,
		objective: 'Explain ore concentration, conversion, reduction, aluminium extraction and common alloys.',
		overview:
			'Metallurgy extracts metals economically from ores. A mineral is a naturally occurring substance containing a metal or its compound; an ore is a mineral from which extraction is practical and economical. Ore is crushed and concentrated by methods such as hydraulic washing, magnetic separation or froth flotation. Sulphide ores are commonly roasted in air, while carbonates and hydrated ores are calcined with limited or no air to form oxides. Moderately reactive metal oxides may be reduced by carbon, carbon monoxide or hydrogen, but highly reactive metals require electrolysis. Aluminium is obtained from purified bauxite: Bayer’s process removes impurities, and the Hall–Héroult process electrolyses alumina dissolved in molten cryolite, which lowers operating temperature and improves conductivity. Carbon anodes are consumed by oxygen formed at the anode. Refining improves purity. Alloys combine useful properties; examples include brass, bronze, stainless steel, duralumin, magnalium and solder, each with a specified composition and use.',
		points: [
			'An ore is a mineral from which a metal can be extracted conveniently and economically.',
			'Roasting heats sulphide ore in excess air; calcination heats carbonate or hydrated ore with little or no air.',
			'Highly reactive metals such as aluminium cannot be reduced by carbon and are extracted electrolytically.',
			'Cryolite lowers the melting point of alumina and improves conductivity in the Hall–Héroult cell.',
		],
		worked: [
			'Why is aluminium oxide not reduced with carbon, and what method is used instead?',
			[
				'Aluminium is above carbon in the activity series and its oxide is very stable.',
				'Carbon cannot remove oxygen from Al₂O₃ under ordinary extraction conditions.',
				'Alumina dissolved in molten cryolite is therefore electrolysed in the Hall–Héroult process.',
			],
			'Electrolytic reduction of alumina in molten cryolite.',
		],
	},
	{
		classLevel: 'X',
		slug: 'hydrogen-chloride',
		title: 'Hydrogen Chloride',
		unit: 'Study of Compounds',
		minutes: 50,
		objective: 'Describe preparation, collection, solubility, acidic reactions, tests and uses of hydrogen chloride.',
		overview:
			'Hydrogen chloride gas is prepared in the laboratory by warming sodium chloride with concentrated sulphuric acid. Because it is highly soluble in water and denser than air, it is collected by downward displacement of air rather than over water. Dry HCl does not affect dry blue litmus because ions are not formed without water; dissolved HCl forms hydronium and chloride ions and shows strong acidic properties. Its exceptional solubility is demonstrated by the fountain experiment. Hydrogen chloride reacts with ammonia to form dense white fumes of ammonium chloride. Hydrochloric acid reacts with suitable metals, metal oxides, hydroxides and carbonates to form chlorides. Chloride ions produce a white precipitate of silver chloride with silver nitrate after appropriate acidification; the precipitate dissolves in ammonium hydroxide. Aqua regia is one volume concentrated nitric acid with three volumes concentrated hydrochloric acid and dissolves noble metals such as gold.',
		points: [
			'HCl gas is highly soluble in water, denser than air and collected by downward displacement of air.',
			'Dry HCl is not acidic to dry litmus; water enables ionisation to H₃O⁺ and Cl⁻.',
			'HCl and NH₃ form dense white fumes of NH₄Cl.',
			'Chloride ions give white AgCl with AgNO₃, and AgCl dissolves in ammonium hydroxide.',
		],
		worked: [
			'Explain why hydrogen chloride cannot be collected over water and why dry HCl does not redden dry blue litmus.',
			[
				'HCl dissolves extremely readily in water, so water collection would absorb the gas.',
				'Acid behaviour requires hydronium ions formed when HCl ionises in water.',
				'With no water on dry litmus, ionisation does not occur and the colour remains unchanged.',
			],
			'It is very soluble; acidity requires water for ionisation.',
		],
	},
	{
		classLevel: 'X',
		slug: 'ammonia',
		title: 'Ammonia',
		unit: 'Study of Compounds',
		minutes: 50,
		objective: 'Explain preparation, Haber manufacture, properties, reactions, tests and uses of ammonia.',
		overview:
			'Ammonia is prepared in the laboratory by heating an ammonium salt such as ammonium chloride with calcium hydroxide. It is dried with quicklime because common acidic drying agents react with it. Ammonia is extremely soluble in water and lighter than air, so it is collected by downward displacement of air and not over water. Its fountain experiment demonstrates high solubility; aqueous ammonia is weakly alkaline because only some molecules form ammonium and hydroxide ions. The Haber process combines nitrogen and hydrogen reversibly using an iron catalyst at elevated temperature and pressure, with product removal improving yield. Ammonia forms white fumes with hydrogen chloride, reduces hot copper(II) oxide, burns in oxygen and is catalytically oxidised to nitric oxide in nitric acid manufacture. With chlorine, products depend on which reactant is in excess. Uses include fertilisers, nitric acid, explosives, refrigerants and cleaning solutions. A pungent smell, red-litmus-to-blue change and white HCl fumes identify it.',
		points: [
			'Laboratory ammonia is made by heating an ammonium salt with a strong base and is dried with quicklime.',
			'Ammonia is lighter than air, highly soluble in water and weakly alkaline in aqueous solution.',
			'The Haber process uses nitrogen and hydrogen, an iron catalyst, raised pressure and a compromise temperature.',
			'Ammonia gives dense white NH₄Cl fumes with HCl and reduces hot CuO to copper.',
		],
		worked: [
			'Write the balanced laboratory preparation equation for ammonia from ammonium chloride and calcium hydroxide.',
			[
				'Identify products: calcium chloride, ammonia and water.',
				'Start with 2NH₄Cl to supply two ammonium ions and match CaCl₂.',
				'Balance hydrogen and oxygen: 2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O.',
			],
			'2NH₄Cl + Ca(OH)₂ → CaCl₂ + 2NH₃ + 2H₂O.',
		],
	},
	{
		classLevel: 'X',
		slug: 'nitric-acid',
		title: 'Nitric Acid',
		unit: 'Study of Compounds',
		minutes: 50,
		objective: 'Describe preparation, Ostwald manufacture, oxidising reactions, tests and uses of nitric acid.',
		overview:
			'Nitric acid is prepared in the laboratory by heating an alkali-metal nitrate with concentrated sulphuric acid below about 200 °C and condensing the volatile acid. Industrially, the Ostwald process catalytically oxidises ammonia to nitric oxide over platinum–rhodium gauze; further oxidation gives nitrogen dioxide, which is absorbed in water with oxygen to form nitric acid. Pure nitric acid is colourless but may appear yellow because dissolved nitrogen dioxide forms on decomposition. It is a strong acid and a powerful oxidising agent. Most metals do not liberate hydrogen from nitric acid because the acid oxidises the hydrogen and is reduced to nitrogen oxides; product depends on concentration and metal. Concentrated nitric acid passivates iron and aluminium at ordinary temperature by forming a protective oxide film. It oxidises carbon and sulphur and forms nitrates with bases and carbonates. Nitrate identification uses the brown-ring test under controlled laboratory conditions. Uses include fertilisers, explosives, dyes and chemical manufacture.',
		points: [
			'Laboratory HNO₃ is displaced from a nitrate by concentrated H₂SO₄ and collected by condensation.',
			'The Ostwald process oxidises NH₃ to NO, then NO₂, followed by absorption to form nitric acid.',
			'Nitric acid usually does not release H₂ from metals because it is a strong oxidising agent.',
			'Concentrated nitric acid passivates iron and aluminium by forming a protective oxide layer.',
		],
		worked: [
			'Why is the apparatus kept below about 200 °C when preparing nitric acid from sodium nitrate and concentrated sulphuric acid?',
			[
				'Moderate heating distils nitric acid from the reaction mixture.',
				'At excessive temperature nitric acid decomposes and contaminating nitrogen dioxide forms.',
				'Keeping the temperature controlled improves purity and safe collection by condensation.',
			],
			'To limit decomposition and obtain purer nitric acid.',
		],
	},
	{
		classLevel: 'X',
		slug: 'sulphuric-acid',
		title: 'Sulphuric Acid',
		unit: 'Study of Compounds',
		minutes: 50,
		objective: 'Explain Contact manufacture and distinguish dilute-acid, oxidising, dehydrating and non-volatile behaviour.',
		overview:
			'Sulphuric acid is manufactured by the Contact process. Sulphur dioxide is purified, mixed with air and reversibly oxidised to sulphur trioxide over vanadium(V) oxide at a compromise temperature. Sulphur trioxide is absorbed in concentrated sulphuric acid to form oleum, which is diluted safely to the desired acid concentration. Direct absorption in water is avoided because a corrosive acid mist forms. Dilute sulphuric acid behaves as a strong dibasic acid, reacting with suitable metals, bases, carbonates, hydrogencarbonates, sulphites and sulphides. Concentrated sulphuric acid is also an oxidising agent, converting carbon or sulphur to oxides while being reduced to sulphur dioxide. It is a powerful dehydrating agent, charring sugar and removing water from hydrated copper(II) sulphate, and its low volatility allows it to displace more volatile acids from salts. Sulphate ions produce a white barium sulphate precipitate with barium chloride after acidification.',
		points: [
			'The Contact process uses V₂O₅ to catalyse 2SO₂ + O₂ ⇌ 2SO₃ under compromise conditions.',
			'SO₃ is absorbed in concentrated H₂SO₄ to form oleum before dilution, avoiding acid mist.',
			'Dilute H₂SO₄ shows ordinary acidic reactions; concentrated acid can oxidise and dehydrate.',
			'Sulphate ions give a white insoluble BaSO₄ precipitate with a soluble barium salt after acidification.',
		],
		worked: [
			'Explain why sulphur trioxide is not absorbed directly in water during the Contact process.',
			[
				'The reaction of SO₃ with water is extremely exothermic.',
				'Direct contact produces a fine mist of sulphuric acid that is difficult to condense and hazardous.',
				'SO₃ is first absorbed in concentrated acid to make oleum, which is then diluted.',
			],
			'Direct absorption forms acid mist; use oleum then dilute.',
		],
	},
	{
		classLevel: 'X',
		slug: 'organic-chemistry',
		title: 'Organic Chemistry',
		unit: 'Organic Chemistry',
		minutes: 60,
		objective:
			'Recognise homologous series, structures, nomenclature, isomerism and reactions of selected hydrocarbons and functional groups.',
		overview:
			'Organic chemistry studies carbon compounds, whose diversity follows from tetravalency and catenation. A homologous series has the same functional group and general formula, similar chemical properties and successive members differing by CH₂. Alkanes are saturated hydrocarbons with single bonds; alkenes and alkynes are unsaturated and contain double or triple bonds. Structural formulae reveal connectivity, and IUPAC names identify the longest chain, bond type, substituent positions and functional group. Chain isomerism occurs when compounds share a molecular formula but differ in carbon skeleton. Methane undergoes combustion and substitution with chlorine in light. Ethene and ethyne undergo addition reactions and decolourise bromine solution; ethene can polymerise. Ethanol burns, reacts with sodium and can be oxidised to ethanoic acid. Ethanoic acid shows acidic reactions and reacts with ethanol in the presence of concentrated sulphuric acid to form a sweet-smelling ester. Equations require correct conditions and balanced atoms.',
		points: [
			'A homologous series shares a functional group and general formula; adjacent members differ by CH₂.',
			'Alkanes are saturated, while alkenes and alkynes are unsaturated and undergo addition reactions.',
			'Compounds can share a molecular formula but have different structural arrangements called isomers.',
			'Ethanol oxidises to ethanoic acid, and ethanol plus ethanoic acid forms an ester and water.',
		],
		worked: [
			'Name CH₃CH₂CH₂OH and state the product when it is oxidised under controlled conditions.',
			[
				'The longest chain has three carbon atoms, giving the root propan-.',
				'The terminal –OH group gives the suffix -1-ol, so the name is propan-1-ol.',
				'Oxidation of a primary alcohol gives the corresponding carboxylic acid: propanoic acid.',
			],
			'Propan-1-ol; oxidation gives propanoic acid.',
		],
	},
];

function sql(value) {
	if (value === null) return 'NULL';
	if (typeof value === 'number') return String(value);
	return `'${String(value).replaceAll("'", "''")}'`;
}

function row(values) {
	return `(${values.map(sql).join(', ')})`;
}

function questionRows(chapter, index) {
	const otherPoints = chapters.filter((candidate) => candidate !== chapter).flatMap((candidate) => candidate.points);
	const rows = chapter.points.map((point, pointIndex) => {
		const distractors = [0, 1, 2].map((offset) => otherPoints[(index * 7 + pointIndex * 3 + offset) % otherPoints.length]);
		const order = pointIndex % 4;
		const labels = ['a', 'b', 'c', 'd'];
		const choices = [...distractors];
		choices.splice(order, 0, point);
		const options = choices.map((label, optionIndex) => ({ id: labels[optionIndex], label }));
		return row([
			`${chapter.classLevel.toLowerCase()}-chem-${chapter.slug}-q${pointIndex + 1}`,
			`topic-${chapter.classLevel.toLowerCase()}-chem-${chapter.slug}`,
			'single_choice',
			`Which statement correctly describes ${chapter.title}?`,
			JSON.stringify(options),
			JSON.stringify({ choice: labels[order] }),
			point,
			pointIndex + 1,
			0,
			'reviewed',
			1,
		]);
	});
	const [prompt, , answer] = chapter.worked;
	const answerPool = chapters.filter((candidate) => candidate !== chapter).map((candidate) => candidate.worked[2]);
	const distractors = [0, 1, 2].map((offset) => answerPool[(index * 5 + offset) % answerPool.length]);
	const answerPosition = index % 4;
	const choices = [...distractors];
	choices.splice(answerPosition, 0, answer);
	const labels = ['a', 'b', 'c', 'd'];
	rows.push(
		row([
			`${chapter.classLevel.toLowerCase()}-chem-${chapter.slug}-q5`,
			`topic-${chapter.classLevel.toLowerCase()}-chem-${chapter.slug}`,
			'single_choice',
			`${prompt} Which conclusion is correct?`,
			JSON.stringify(choices.map((label, optionIndex) => ({ id: labels[optionIndex], label }))),
			JSON.stringify({ choice: labels[answerPosition] }),
			chapter.worked[1].join(' '),
			2,
			1,
			'reviewed',
			1,
		]),
	);
	return rows;
}

if (
	chapters.filter((chapter) => chapter.classLevel === 'VIII').length !== 9 ||
	chapters.filter((chapter) => chapter.classLevel === 'X').length !== 12
) {
	throw new Error('Chemistry release must contain 9 Class VIII and 12 Class X chapters.');
}
for (const chapter of chapters) {
	if (chapter.overview.length <= 450 || chapter.points.length !== 4 || chapter.worked[1].length < 3)
		throw new Error(`Incomplete chapter: ${chapter.title}`);
}

const statements = [
	'-- Complete Chemistry release for Classes VIII and X.\n-- All lessons and diagnostics are original Home Study material aligned to official CISCE scope.\n\nPRAGMA foreign_keys = ON;',
	`INSERT INTO curriculum_sources\n  (id, publisher, title, source_kind, source_url, publication_label, retrieved_at, scope_note, review_status)\nVALUES\n${row([official.X.id, 'CISCE', 'ICSE Science (52) Chemistry, Examination Year 2027', 'official_curriculum', official.X.url, 'February 2025', '2026-10-22', 'Authoritative Class X Chemistry examination scope for 2027; Science Paper-2.', 'reviewed'])};`,
];

chapters.forEach((chapter, index) => {
	const prefix = chapter.classLevel.toLowerCase();
	const topicId = `topic-${prefix}-chem-${chapter.slug}`;
	const moduleId = `module-${prefix}-chem-${chapter.slug}`;
	const templateId = `template-${prefix}-chem-${chapter.slug}`;
	const source = official[chapter.classLevel];
	const sequence = chapters.filter((candidate) => candidate.classLevel === chapter.classLevel).indexOf(chapter) + 1;
	const examYear = chapter.classLevel === 'X' ? 2027 : null;
	statements.push(
		`INSERT INTO curriculum_topics\n  (id, board, exam_year, class_level, subject, unit, topic, learning_objective, source_url, source_retrieved_at, review_status, version)\nVALUES\n${row([topicId, 'CISCE', examYear, chapter.classLevel, 'Chemistry', chapter.unit, chapter.title, chapter.objective, source.url, '2026-10-22', 'reviewed', 1])};`,
	);
	statements.push(
		`INSERT INTO curriculum_topic_sources (topic_id, source_id, relationship)\nVALUES ${row([topicId, source.id, 'authoritative_scope'])};`,
	);
	statements.push(
		`INSERT INTO learning_modules\n  (id, topic_id, title, overview, key_points_json, worked_example_json, practice_advice, review_status, version)\nVALUES\n${row([moduleId, topicId, chapter.title, chapter.overview, JSON.stringify(chapter.points), JSON.stringify({ prompt: chapter.worked[0], steps: chapter.worked[1], answer: chapter.worked[2] }), 'Read each equation or observation aloud, identify the governing idea before choosing an answer, and check that atoms, charge, conditions and units are consistent.', 'reviewed', 1])};`,
	);
	const qRows = questionRows(chapter, index);
	statements.push(
		`INSERT INTO questions\n  (id, topic_id, question_type, prompt, options_json, answer_json, rationale, difficulty, requires_rough_work, review_status, version)\nVALUES\n${qRows.join(',\n')};`,
	);
	statements.push(
		`INSERT INTO assignment_templates\n  (id, module_id, class_level, subject, title, instructions, estimated_minutes, review_status, active, version, sequence)\nVALUES\n${row([templateId, moduleId, chapter.classLevel, 'Chemistry', chapter.title, 'Read the lesson and worked example, answer every question, retain rough work where requested, and submit only when ready to review corrections.', chapter.minutes, 'reviewed', 1, 1, sequence])};`,
	);
	const itemRows = Array.from({ length: 5 }, (_, itemIndex) =>
		row([templateId, `${prefix}-chem-${chapter.slug}-q${itemIndex + 1}`, itemIndex]),
	);
	statements.push(`INSERT INTO assignment_template_items (template_id, question_id, position)\nVALUES\n${itemRows.join(',\n')};`);
});

const maxStatement = Math.max(...statements.map((statement) => statement.length));
if (maxStatement > 40000) throw new Error(`Statement too large: ${maxStatement} bytes`);
const output = `${statements.join('\n\n')}\n`;
const target = new NodeURL('../migrations/0014_chemistry_release.sql', import.meta.url);
writeFileSync(target, output);
process.stdout.write(
	`Generated 0014_chemistry_release.sql: ${chapters.length} chapters, ${chapters.length * 5} questions, max statement ${maxStatement} bytes.\n`,
);
