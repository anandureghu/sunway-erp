import { VercelRequest, VercelResponse } from '@vercel/node';

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan","Bolivia",
  "Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Chad",
  "Chile","China","Colombia","Comoros","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark",
  "Dominica","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Guatemala","Guinea","Guyana","Haiti",
  "Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy",
  "Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kuwait","Kyrgyzstan","Laos","Latvia","Lebanon",
  "Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Maldives",
  "Mali","Malta","Mauritania","Mauritius","Mexico","Micronesia","Moldova","Monaco","Mongolia","Montenegro",
  "Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands","New Zealand","Nicaragua","Niger",
  "Nigeria","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Paraguay","Peru","Philippines",
  "Poland","Portugal","Qatar","Romania","Russia","Rwanda","Samoa","Saudi Arabia","Senegal","Serbia",
  "Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia","South Africa","South Korea","Spain",
  "Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand",
  "Togo","Tonga","Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom",
  "United States","Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

// Popular countries that should appear first when searching
const POPULAR_COUNTRIES = [
  "United States",
  "United Kingdom",
  "India",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "China",
  "Singapore",
  "Malaysia",
  "United Arab Emirates",
  "Saudi Arabia",
  "Netherlands",
  "Italy",
  "Spain",
  "Brazil",
  "Russia",
  "South Korea",
  "Mexico"
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    if (!q) {
      // Return popular countries first, then others
      const popular = POPULAR_COUNTRIES.slice(0, 10);
      const others = COUNTRIES.filter(c => !POPULAR_COUNTRIES.includes(c)).slice(0, 40);
      return res.status(200).json([...popular, ...others]);
    }

    // Filter countries that match the query
    const matchingPopular = POPULAR_COUNTRIES.filter(c => 
      c.toLowerCase().includes(q)
    );
    const matchingOthers = COUNTRIES.filter(c => 
      !POPULAR_COUNTRIES.includes(c) && c.toLowerCase().includes(q)
    );

    // Combine: popular matches first, then other matches
    const filtered = [...matchingPopular, ...matchingOthers].slice(0, 50);

    return res.status(200).json(filtered);
  } catch (err) {
    console.error('api/countries error', err);
    res.status(500).json({ error: 'Internal error' });
  }
}
