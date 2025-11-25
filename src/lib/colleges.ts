// Comprehensive list of Indian colleges by category

export type CollegeCategory = "engineering" | "medical" | "law" | "arts_science";

export interface College {
  id: string;
  name: string;
  category: CollegeCategory;
  location: string;
  state: string;
}

export const colleges: College[] = [
  // Engineering Colleges
  { id: "iit-delhi", name: "Indian Institute of Technology Delhi", category: "engineering", location: "New Delhi", state: "Delhi" },
  { id: "iit-bombay", name: "Indian Institute of Technology Bombay", category: "engineering", location: "Mumbai", state: "Maharashtra" },
  { id: "iit-madras", name: "Indian Institute of Technology Madras", category: "engineering", location: "Chennai", state: "Tamil Nadu" },
  { id: "iit-kharagpur", name: "Indian Institute of Technology Kharagpur", category: "engineering", location: "Kharagpur", state: "West Bengal" },
  { id: "iit-kanpur", name: "Indian Institute of Technology Kanpur", category: "engineering", location: "Kanpur", state: "Uttar Pradesh" },
  { id: "iit-roorkee", name: "Indian Institute of Technology Roorkee", category: "engineering", location: "Roorkee", state: "Uttarakhand" },
  { id: "iit-guwahati", name: "Indian Institute of Technology Guwahati", category: "engineering", location: "Guwahati", state: "Assam" },
  { id: "iit-hyderabad", name: "Indian Institute of Technology Hyderabad", category: "engineering", location: "Hyderabad", state: "Telangana" },
  { id: "iit-patna", name: "Indian Institute of Technology Patna", category: "engineering", location: "Patna", state: "Bihar" },
  { id: "iit-gandhinagar", name: "Indian Institute of Technology Gandhinagar", category: "engineering", location: "Gandhinagar", state: "Gujarat" },
  { id: "nit-trichy", name: "National Institute of Technology Tiruchirappalli", category: "engineering", location: "Tiruchirappalli", state: "Tamil Nadu" },
  { id: "nit-warangal", name: "National Institute of Technology Warangal", category: "engineering", location: "Warangal", state: "Telangana" },
  { id: "nit-surathkal", name: "National Institute of Technology Karnataka", category: "engineering", location: "Surathkal", state: "Karnataka" },
  { id: "nit-calicut", name: "National Institute of Technology Calicut", category: "engineering", location: "Calicut", state: "Kerala" },
  { id: "nit-jaipur", name: "Malaviya National Institute of Technology Jaipur", category: "engineering", location: "Jaipur", state: "Rajasthan" },
  { id: "bits-pilani", name: "Birla Institute of Technology and Science, Pilani", category: "engineering", location: "Pilani", state: "Rajasthan" },
  { id: "vit-vellore", name: "Vellore Institute of Technology", category: "engineering", location: "Vellore", state: "Tamil Nadu" },
  { id: "iiit-hyderabad", name: "International Institute of Information Technology Hyderabad", category: "engineering", location: "Hyderabad", state: "Telangana" },
  { id: "delhi-tech", name: "Delhi Technological University", category: "engineering", location: "New Delhi", state: "Delhi" },
  { id: "thapar", name: "Thapar Institute of Engineering and Technology", category: "engineering", location: "Patiala", state: "Punjab" },
  { id: "mnit-allahabad", name: "Motilal Nehru National Institute of Technology Allahabad", category: "engineering", location: "Allahabad", state: "Uttar Pradesh" },
  { id: "svnit-surat", name: "Sardar Vallabhbhai National Institute of Technology Surat", category: "engineering", location: "Surat", state: "Gujarat" },
  { id: "manit-bhopal", name: "Maulana Azad National Institute of Technology Bhopal", category: "engineering", location: "Bhopal", state: "Madhya Pradesh" },
  { id: "nit-rourkela", name: "National Institute of Technology Rourkela", category: "engineering", location: "Rourkela", state: "Odisha" },
  { id: "nit-durgapur", name: "National Institute of Technology Durgapur", category: "engineering", location: "Durgapur", state: "West Bengal" },
  
  // Medical Colleges
  { id: "aiims-delhi", name: "All India Institute of Medical Sciences Delhi", category: "medical", location: "New Delhi", state: "Delhi" },
  { id: "aiims-jodhpur", name: "All India Institute of Medical Sciences Jodhpur", category: "medical", location: "Jodhpur", state: "Rajasthan" },
  { id: "aiims-bhopal", name: "All India Institute of Medical Sciences Bhopal", category: "medical", location: "Bhopal", state: "Madhya Pradesh" },
  { id: "aiims-bhubaneswar", name: "All India Institute of Medical Sciences Bhubaneswar", category: "medical", location: "Bhubaneswar", state: "Odisha" },
  { id: "aiims-raipur", name: "All India Institute of Medical Sciences Raipur", category: "medical", location: "Raipur", state: "Chhattisgarh" },
  { id: "aiims-rihand", name: "All India Institute of Medical Sciences Rishikesh", category: "medical", location: "Rishikesh", state: "Uttarakhand" },
  { id: "pgimer-chandigarh", name: "Post Graduate Institute of Medical Education and Research Chandigarh", category: "medical", location: "Chandigarh", state: "Chandigarh" },
  { id: "cmc-vellore", name: "Christian Medical College Vellore", category: "medical", location: "Vellore", state: "Tamil Nadu" },
  { id: "afmc-pune", name: "Armed Forces Medical College Pune", category: "medical", location: "Pune", state: "Maharashtra" },
  { id: "kgmc-lucknow", name: "King George's Medical University Lucknow", category: "medical", location: "Lucknow", state: "Uttar Pradesh" },
  { id: "jipmer-pondicherry", name: "Jawaharlal Institute of Postgraduate Medical Education and Research Pondicherry", category: "medical", location: "Pondicherry", state: "Puducherry" },
  { id: "kgmc-delhi", name: "Lady Hardinge Medical College Delhi", category: "medical", location: "New Delhi", state: "Delhi" },
  { id: "seth-gs", name: "Seth Gordhandas Sunderdas Medical College Mumbai", category: "medical", location: "Mumbai", state: "Maharashtra" },
  { id: "ms-ramiah", name: "M.S. Ramaiah Medical College Bangalore", category: "medical", location: "Bangalore", state: "Karnataka" },
  { id: "stanley-medical", name: "Stanley Medical College Chennai", category: "medical", location: "Chennai", state: "Tamil Nadu" },
  { id: "gmch-chandigarh", name: "Government Medical College and Hospital Chandigarh", category: "medical", location: "Chandigarh", state: "Chandigarh" },
  { id: "bj-medical", name: "B.J. Medical College Ahmedabad", category: "medical", location: "Ahmedabad", state: "Gujarat" },
  { id: "niloufer", name: "Niloufer Hospital and Osmania Medical College Hyderabad", category: "medical", location: "Hyderabad", state: "Telangana" },
  { id: "calcutta-medical", name: "Calcutta Medical College Kolkata", category: "medical", location: "Kolkata", state: "West Bengal" },
  { id: "jnmc-aligarh", name: "Jawaharlal Nehru Medical College Aligarh", category: "medical", location: "Aligarh", state: "Uttar Pradesh" },
  
  // Law Colleges
  { id: "nlsiu-bangalore", name: "National Law School of India University Bangalore", category: "law", location: "Bangalore", state: "Karnataka" },
  { id: "nls-delhi", name: "National Law University Delhi", category: "law", location: "New Delhi", state: "Delhi" },
  { id: "nujs-kolkata", name: "West Bengal National University of Juridical Sciences Kolkata", category: "law", location: "Kolkata", state: "West Bengal" },
  { id: "nlu-jodhpur", name: "National Law University Jodhpur", category: "law", location: "Jodhpur", state: "Rajasthan" },
  { id: "nlu-hyderabad", name: "NALSAR University of Law Hyderabad", category: "law", location: "Hyderabad", state: "Telangana" },
  { id: "gnlu-gandhinagar", name: "Gujarat National Law University Gandhinagar", category: "law", location: "Gandhinagar", state: "Gujarat" },
  { id: "hnlu-raipur", name: "Hidayatullah National Law University Raipur", category: "law", location: "Raipur", state: "Chhattisgarh" },
  { id: "rgnul-patiala", name: "Rajiv Gandhi National University of Law Patiala", category: "law", location: "Patiala", state: "Punjab" },
  { id: "cnlu-patna", name: "Chanakya National Law University Patna", category: "law", location: "Patna", state: "Bihar" },
  { id: "nluj-jaipur", name: "National Law University Jodhpur", category: "law", location: "Jaipur", state: "Rajasthan" },
  { id: "nliu-bhopal", name: "National Law Institute University Bhopal", category: "law", location: "Bhopal", state: "Madhya Pradesh" },
  { id: "nlud-delhi", name: "National Law University and Judicial Academy Assam", category: "law", location: "Guwahati", state: "Assam" },
  { id: "mnlu-mumbai", name: "Maharashtra National Law University Mumbai", category: "law", location: "Mumbai", state: "Maharashtra" },
  { id: "mnlu-nagpur", name: "Maharashtra National Law University Nagpur", category: "law", location: "Nagpur", state: "Maharashtra" },
  { id: "mnlu-aurangabad", name: "Maharashtra National Law University Aurangabad", category: "law", location: "Aurangabad", state: "Maharashtra" },
  { id: "snlu-kolkata", name: "Symbiosis Law School Pune", category: "law", location: "Pune", state: "Maharashtra" },
  { id: "glc-mumbai", name: "Government Law College Mumbai", category: "law", location: "Mumbai", state: "Maharashtra" },
  { id: "campus-law", name: "Campus Law Centre University of Delhi", category: "law", location: "New Delhi", state: "Delhi" },
  { id: "ils-pune", name: "Indian Law Society's Law College Pune", category: "law", location: "Pune", state: "Maharashtra" },
  { id: "jgls-jindal", name: "Jindal Global Law School Sonipat", category: "law", location: "Sonipat", state: "Haryana" },
  
  // Arts & Science Colleges
  { id: "du-delhi", name: "University of Delhi", category: "arts_science", location: "New Delhi", state: "Delhi" },
  { id: "ju-kolkata", name: "Jadavpur University Kolkata", category: "arts_science", location: "Kolkata", state: "West Bengal" },
  { id: "bu-hyderabad", name: "University of Hyderabad", category: "arts_science", location: "Hyderabad", state: "Telangana" },
  { id: "pu-chandigarh", name: "Panjab University Chandigarh", category: "arts_science", location: "Chandigarh", state: "Chandigarh" },
  { id: "jnu-delhi", name: "Jawaharlal Nehru University Delhi", category: "arts_science", location: "New Delhi", state: "Delhi" },
  { id: "bhu-varanasi", name: "Banaras Hindu University Varanasi", category: "arts_science", location: "Varanasi", state: "Uttar Pradesh" },
  { id: "alu-aligarh", name: "Aligarh Muslim University Aligarh", category: "arts_science", location: "Aligarh", state: "Uttar Pradesh" },
  { id: "mu-mumbai", name: "University of Mumbai", category: "arts_science", location: "Mumbai", state: "Maharashtra" },
  { id: "cu-calcutta", name: "University of Calcutta", category: "arts_science", location: "Kolkata", state: "West Bengal" },
  { id: "pu-pune", name: "Savitribai Phule Pune University", category: "arts_science", location: "Pune", state: "Maharashtra" },
  { id: "au-allahabad", name: "University of Allahabad", category: "arts_science", location: "Allahabad", state: "Uttar Pradesh" },
  { id: "osmania-hyderabad", name: "Osmania University Hyderabad", category: "arts_science", location: "Hyderabad", state: "Telangana" },
  { id: "anna-chennai", name: "Anna University Chennai", category: "arts_science", location: "Chennai", state: "Tamil Nadu" },
  { id: "mcu-madurai", name: "Madurai Kamaraj University Madurai", category: "arts_science", location: "Madurai", state: "Tamil Nadu" },
  { id: "bu-bangalore", name: "Bangalore University Bangalore", category: "arts_science", location: "Bangalore", state: "Karnataka" },
  { id: "mu-mysore", name: "University of Mysore Mysore", category: "arts_science", location: "Mysore", state: "Karnataka" },
  { id: "gauhati-guwahati", name: "Gauhati University Guwahati", category: "arts_science", location: "Guwahati", state: "Assam" },
  { id: "bu-burdwan", name: "The University of Burdwan Bardhaman", category: "arts_science", location: "Bardhaman", state: "West Bengal" },
  { id: "kurukshetra", name: "Kurukshetra University Kurukshetra", category: "arts_science", location: "Kurukshetra", state: "Haryana" },
  { id: "gu-gandhinagar", name: "Gujarat University Ahmedabad", category: "arts_science", location: "Ahmedabad", state: "Gujarat" },
];

export const collegeCategories: { value: CollegeCategory; label: string }[] = [
  { value: "engineering", label: "Engineering" },
  { value: "medical", label: "Medical" },
  { value: "law", label: "Law" },
  { value: "arts_science", label: "Arts & Science" },
];

export function getCollegesByCategory(category: CollegeCategory | "all"): College[] {
  if (category === "all") return colleges;
  return colleges.filter(college => college.category === category);
}

export function getCollegeById(id: string): College | undefined {
  return colleges.find(college => college.id === id);
}

export function searchColleges(query: string): College[] {
  const lowerQuery = query.toLowerCase();
  return colleges.filter(college => 
    college.name.toLowerCase().includes(lowerQuery) ||
    college.location.toLowerCase().includes(lowerQuery) ||
    college.state.toLowerCase().includes(lowerQuery)
  );
}

