import { diseases } from '../data/diseases.js'

/**
 * Mock AI analyzer — deterministically picks a disease based on filename hash.
 * In production, replace with a real ML model API call.
 */
export function analyzeImage(filename) {
  // Simple hash of filename to deterministically pick a disease
  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) % diseases.length
  }
  const disease = diseases[Math.abs(hash) % diseases.length]
  const confidence = Math.floor(75 + Math.random() * 20) // 75-95%
  return { disease, confidence }
}

/**
 * Mock Pest analyzer — deterministically picks a pest based on filename hash.
 */
export function analyzePest(filename) {
  const pests = [
    {
      pest: "Aphids (இலைப்பேன்கள்)",
      plant: "Tomato, Chilli, Brinjal, Rose",
      description: "Tiny green or black soft-bodied insects clustering on young stems and under leaves, sucking plant sap.",
      severity: "Medium",
      damage: [
        "Curled or yellowed leaves",
        "Stunted plant growth",
        "Sticky honeydew residue on leaves"
      ],
      control: [
        "Spray plants with a strong stream of water to dislodge them",
        "Introduce natural predators like ladybugs or lacewings"
      ],
      organic: [
        "Spray neem oil mixed with mild liquid soap",
        "Apply garlic-chilli extract spray"
      ],
      chemicals: [
        { name: "Imidacloprid", dosage: "0.5 ml per litre" },
        { name: "Dimethoate", dosage: "1.5 ml per litre" }
      ]
    },
    {
      pest: "Spider Mites (செம்பேன்)",
      plant: "Okra, Tomato, Cucumber, Beans",
      description: "Very tiny reddish or yellow mites crawling on the undersides of leaves, forming fine webbing.",
      severity: "High",
      damage: [
        "Fine white or yellow speckling on leaves",
        "Leaves turning bronze or dry",
        "Fine webs visible on plant tips"
      ],
      control: [
        "Remove heavily infested leaves",
        "Maintain high humidity around the plants"
      ],
      organic: [
        "Spray rosemary oil solution",
        "Apply organic insecticidal soap"
      ],
      chemicals: [
        { name: "Abamectin", dosage: "0.5 ml per litre" },
        { name: "Propargite", dosage: "2 ml per litre" }
      ]
    },
    {
      pest: "Whiteflies (வெள்ளை ஈ)",
      plant: "Cotton, Tomato, Okra, Papaya",
      description: "Small, white-winged insects that fly up in clouds when the plant is disturbed, feeding on sap.",
      severity: "Medium",
      damage: [
        "Yellowing and premature drop of leaves",
        "Sticky honeydew leading to black sooty mold",
        "Transmission of viral diseases"
      ],
      control: [
        "Hang yellow sticky traps around the plants",
        "Vacuum flies from leaves early in the morning"
      ],
      organic: [
        "Spray soap-oil emulsion",
        "Use neem seed kernel extract (NSKE 5%)"
      ],
      chemicals: [
        { name: "Acetamiprid", dosage: "0.2g per litre" },
        { name: "Diafenthiuron", dosage: "1g per litre" }
      ]
    }
  ]

  let hash = 0
  for (let i = 0; i < filename.length; i++) {
    hash = (hash * 31 + filename.charCodeAt(i)) % pests.length
  }
  return pests[Math.abs(hash) % pests.length]
}
