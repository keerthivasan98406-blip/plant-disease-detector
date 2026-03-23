export interface Disease {
  id: string
  name: string
  plant: string
  description: string
  symptoms: string[]
  treatment: string[]
  medicines: Medicine[]
  prevention: string[]
  severity: 'Low' | 'Medium' | 'High'
  imageUrl?: string
}

export interface Medicine {
  name: string
  dosage: string
  frequency: string
}

export interface ScanResult {
  id: string
  imageName: string
  imageUrl: string
  disease: Disease
  confidence: number
  isHealthy: boolean
  timestamp: string
}

export interface ScanHistory {
  id: string
  imageName: string
  imageUrl: string
  diseaseName: string
  confidence: number
  timestamp: string
  severity: 'Low' | 'Medium' | 'High'
}
