-- Corrections raised by the independent review of the Class X Physics book alignment.
-- 1. Lens worked example: the negative magnification is what shows an inverted image.
-- 2. Physics topics are named after the book chapter that now owns their scope.

PRAGMA foreign_keys = ON;

UPDATE learning_modules
SET worked_example_json = '{"prompt": "A convex lens of focal length 20 cm forms an image of an object placed 30 cm in front of it. Using the lens formula, find the position of the image and state its magnification and nature.", "steps": ["Apply the sign convention: distances measured against the direction of the incident light are taken as negative, so u = −30 cm, and a converging lens has f = +20 cm.", "Substitute into the lens formula: 1/v = 1/f + 1/u = 1/20 − 1/30 = (3 − 2)/60 = 1/60 cm⁻¹.", "Therefore v = +60 cm, so the image is formed 60 cm behind the lens on the side away from the object, which makes it a real image.", "Magnification m = v/u = (+60 cm)/(−30 cm) = −2. The magnitude 2 means the image is twice as tall as the object, and the negative sign shows that the image is inverted."], "answer": "v = +60 cm (a real image 60 cm behind the lens) and m = −2, so the image is inverted and twice as tall as the object"}',
    version = version + 1
WHERE id = 'module-x-physics-lenses-spectrum-scattering';

UPDATE curriculum_topics
  SET topic = 'Force',
      version = version + 1
WHERE id = 'topic-x-physics-turning-forces';
UPDATE curriculum_topics
  SET topic = 'Work, Energy and Power',
      version = version + 1
WHERE id = 'topic-x-physics-work-energy-power';
UPDATE curriculum_topics
  SET topic = 'Machines',
      version = version + 1
WHERE id = 'topic-x-physics-machines-conservation-energy';
UPDATE curriculum_topics
  SET topic = 'Refraction of Light at Plane Surfaces',
      version = version + 1
WHERE id = 'topic-x-physics-refraction-tir';
UPDATE curriculum_topics
  SET topic = 'Refraction through a Lens',
      learning_objective = 'Construct ray diagrams for converging and diverging lenses, apply the lens formula and sign convention to locate images and find magnification, and explain the power of a lens and the magnifying glass.',
      version = version + 1
WHERE id = 'topic-x-physics-lenses-spectrum-scattering';
UPDATE curriculum_topics
  SET topic = 'Spectrum',
      version = version + 1
WHERE id = 'topic-x-physics-spectrum';
UPDATE curriculum_topics
  SET topic = 'Sound',
      version = version + 1
WHERE id = 'topic-x-physics-sound';
UPDATE curriculum_topics
  SET topic = 'Current Electricity',
      learning_objective = 'Relate current to charge and time, apply Ohm’s law, explain how length, area and material affect resistance, reduce series and parallel networks, and analyse cells with internal resistance including terminal voltage and power.',
      version = version + 1
WHERE id = 'topic-x-physics-electricity';
UPDATE curriculum_topics
  SET topic = 'Household Circuits',
      version = version + 1
WHERE id = 'topic-x-physics-household-circuits';
UPDATE curriculum_topics
  SET topic = 'Electro-magnetism',
      version = version + 1
WHERE id = 'topic-x-physics-magnetism-induction';
UPDATE curriculum_topics
  SET topic = 'Calorimetry',
      version = version + 1
WHERE id = 'topic-x-physics-heat-calorimetry';
UPDATE curriculum_topics
  SET topic = 'Radioactivity',
      version = version + 1
WHERE id = 'topic-x-physics-modern-physics';

