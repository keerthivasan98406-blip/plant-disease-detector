export const diseases = [
  {
    id: '1',
    name: 'Late Blight',
    plant: 'Tomato / Potato',
    description: 'A devastating fungal disease caused by Phytophthora infestans that affects tomatoes and potatoes, causing rapid decay of leaves, stems, and fruits.',
    symptoms: [
      'Dark brown or black water-soaked lesions on leaves',
      'White fuzzy mold on undersides of leaves in humid conditions',
      'Brown lesions on stems and petioles',
      'Firm, brown rot on fruits or tubers',
      'Rapid wilting and plant collapse'
    ],
    treatment: [
      'Remove and destroy all infected plant material immediately',
      'Apply copper-based fungicide every 7-10 days',
      'Improve air circulation by pruning dense foliage',
      'Avoid overhead irrigation; use drip irrigation instead',
      'Apply mancozeb or chlorothalonil fungicide as directed'
    ],
    medicines: [
      { name: 'Mancozeb 75% WP', dosage: '2.5 g/L water', frequency: 'Every 7 days' },
      { name: 'Copper Oxychloride', dosage: '3 g/L water', frequency: 'Every 10 days' },
      { name: 'Metalaxyl + Mancozeb', dosage: '2 g/L water', frequency: 'Every 14 days' }
    ],
    prevention: [
      'Use certified disease-free seeds and transplants',
      'Rotate crops — avoid planting tomatoes/potatoes in same spot for 3 years',
      'Plant resistant varieties when available',
      'Maintain proper plant spacing for air circulation',
      'Monitor weather — apply preventive fungicide before rainy periods'
    ],
    severity: 'High'
  },
  {
    id: '2',
    name: 'Powdery Mildew',
    plant: 'Cucumber / Squash / Grapes',
    description: 'A fungal disease caused by various Erysiphales species, appearing as white powdery spots on leaves and stems.',
    symptoms: [
      'White or gray powdery spots on upper leaf surfaces',
      'Yellowing and browning of affected leaves',
      'Distorted or stunted new growth',
      'Premature leaf drop',
      'Reduced fruit quality and yield'
    ],
    treatment: [
      'Apply sulfur-based fungicide at first sign of infection',
      'Use neem oil spray (2 tbsp per gallon) weekly',
      'Remove heavily infected leaves and dispose properly',
      'Apply potassium bicarbonate solution',
      'Use systemic fungicide (myclobutanil) for severe cases'
    ],
    medicines: [
      { name: 'Sulfur 80% WP', dosage: '3 g/L water', frequency: 'Every 7-10 days' },
      { name: 'Neem Oil 1500 ppm', dosage: '5 mL/L water', frequency: 'Every 7 days' },
      { name: 'Myclobutanil 10% WP', dosage: '1 g/L water', frequency: 'Every 14 days' }
    ],
    prevention: [
      'Plant resistant varieties',
      'Ensure adequate spacing between plants',
      'Avoid excessive nitrogen fertilization',
      'Water at the base of plants, not on foliage',
      'Apply preventive neem oil spray during humid weather'
    ],
    severity: 'Medium'
  },
  {
    id: '3',
    name: 'Bacterial Leaf Spot',
    plant: 'Pepper / Tomato',
    description: 'Caused by Xanthomonas bacteria, this disease creates water-soaked spots that turn brown and may cause significant defoliation.',
    symptoms: [
      'Small, water-soaked spots on leaves that turn brown',
      'Yellow halo surrounding dark lesions',
      'Spots may merge causing large necrotic areas',
      'Raised, scab-like lesions on fruits',
      'Premature defoliation in severe cases'
    ],
    treatment: [
      'Apply copper-based bactericide immediately',
      'Remove and destroy infected plant debris',
      'Avoid working with plants when wet',
      'Apply fixed copper spray every 5-7 days during wet weather',
      'Use streptomycin sulfate for severe bacterial infections'
    ],
    medicines: [
      { name: 'Copper Hydroxide 77% WP', dosage: '2 g/L water', frequency: 'Every 5-7 days' },
      { name: 'Streptomycin Sulfate', dosage: '0.5 g/L water', frequency: 'Every 7 days' },
      { name: 'Bordeaux Mixture', dosage: '10 g/L water', frequency: 'Every 10 days' }
    ],
    prevention: [
      'Use pathogen-free certified seeds',
      'Treat seeds with hot water (50°C for 25 minutes) before planting',
      'Avoid overhead irrigation',
      'Practice crop rotation with non-host plants',
      'Sanitize tools and equipment regularly'
    ],
    severity: 'Medium'
  },
  {
    id: '4',
    name: 'Rice Blast',
    plant: 'Rice',
    description: 'One of the most destructive rice diseases worldwide, caused by Magnaporthe oryzae fungus, affecting all above-ground parts of the plant.',
    symptoms: [
      'Diamond-shaped lesions with gray centers and brown borders on leaves',
      'Lesions on leaf collars causing leaf death',
      'Neck rot causing panicle to fall over (neck blast)',
      'Infected nodes turn black and break easily',
      'Partial or complete sterility of grains'
    ],
    treatment: [
      'Apply tricyclazole or isoprothiolane fungicide immediately',
      'Drain fields and reduce nitrogen application',
      'Apply fungicide at booting stage as preventive measure',
      'Use systemic fungicide for neck blast control',
      'Harvest early if neck blast is severe'
    ],
    medicines: [
      { name: 'Tricyclazole 75% WP', dosage: '0.6 g/L water', frequency: 'Every 10-14 days' },
      { name: 'Isoprothiolane 40% EC', dosage: '1.5 mL/L water', frequency: 'Every 14 days' },
      { name: 'Carbendazim 50% WP', dosage: '1 g/L water', frequency: 'Every 10 days' }
    ],
    prevention: [
      'Plant blast-resistant varieties',
      'Avoid excessive nitrogen fertilization',
      'Maintain proper water management',
      'Use balanced fertilization (N:P:K)',
      'Apply silicon fertilizer to strengthen plant cell walls'
    ],
    severity: 'High'
  },
  {
    id: '5',
    name: 'Anthracnose',
    plant: 'Mango / Chili / Bean',
    description: 'A fungal disease caused by Colletotrichum species that affects fruits, leaves, and stems, causing dark sunken lesions.',
    symptoms: [
      'Dark, sunken lesions on fruits and leaves',
      'Pink or orange spore masses in humid conditions',
      'Premature fruit drop',
      'Twig dieback in severe infections',
      'Post-harvest fruit rot'
    ],
    treatment: [
      'Apply mancozeb or copper fungicide at first sign',
      'Remove and destroy infected fruits and plant parts',
      'Apply post-harvest fungicide treatment for stored fruits',
      'Use thiophanate-methyl for systemic control',
      'Improve orchard sanitation'
    ],
    medicines: [
      { name: 'Mancozeb 75% WP', dosage: '2.5 g/L water', frequency: 'Every 7-10 days' },
      { name: 'Thiophanate-methyl 70% WP', dosage: '1 g/L water', frequency: 'Every 14 days' },
      { name: 'Azoxystrobin 23% SC', dosage: '1 mL/L water', frequency: 'Every 14 days' }
    ],
    prevention: [
      'Prune trees to improve air circulation',
      'Apply preventive fungicide before flowering',
      'Avoid wounding fruits during harvest',
      'Use hot water treatment for post-harvest control',
      'Remove fallen leaves and fruits from orchard floor'
    ],
    severity: 'Medium'
  },
  {
    id: '6',
    name: 'Downy Mildew',
    plant: 'Grapes / Cucumber / Lettuce',
    description: 'Caused by oomycete pathogens, downy mildew thrives in cool, moist conditions and can devastate crops rapidly.',
    symptoms: [
      'Yellow or pale green spots on upper leaf surface',
      'Gray, purple, or white downy growth on leaf undersides',
      'Affected leaves curl, brown, and die',
      'Stunted plant growth',
      'Infected fruits show discoloration and rot'
    ],
    treatment: [
      'Apply metalaxyl-based fungicide immediately',
      'Remove and destroy infected plant material',
      'Improve drainage and reduce humidity',
      'Apply copper-based fungicide as protective spray',
      'Use fosetyl-aluminum for systemic protection'
    ],
    medicines: [
      { name: 'Metalaxyl + Mancozeb', dosage: '2.5 g/L water', frequency: 'Every 7-10 days' },
      { name: 'Fosetyl-Aluminum 80% WP', dosage: '2.5 g/L water', frequency: 'Every 14 days' },
      { name: 'Cymoxanil + Mancozeb', dosage: '2 g/L water', frequency: 'Every 7 days' }
    ],
    prevention: [
      'Plant resistant varieties',
      'Avoid overhead irrigation',
      'Ensure good air circulation through proper spacing',
      'Apply preventive fungicide before wet weather',
      'Practice crop rotation'
    ],
    severity: 'High'
  }
]
