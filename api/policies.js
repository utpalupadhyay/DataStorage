const fs = require('fs');
const path = require('path');

// Initial default pre-populated LIC records
const defaultPolicies = [
    {
        id: 'LIC-1001',
        customerName: 'उत्पल उपाध्याय (Utpal Upadhyay)',
        phone: '9876543210',
        policyNo: '876543210',
        planName: 'Jeevan Labh (Table 936)',
        sumAssured: 500000,
        premiumAmount: 24500,
        frequency: 'Yearly',
        status: 'active',
        dueDate: '2026-09-15',
        maturityDate: '2042-09-15',
        nominee: 'सुनिता उपाध्याय (पत्नी)',
        notes: 'ब्रांच कोड 883, ऑटो-डेबिट ECS एक्टिव।',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'LIC-1002',
        customerName: 'राजेश शर्मा (Rajesh Sharma)',
        phone: '9812345678',
        policyNo: '912345678',
        planName: 'Jeevan Anand (Table 915)',
        sumAssured: 1000000,
        premiumAmount: 48000,
        frequency: 'Yearly',
        status: 'due',
        dueDate: '2026-08-25',
        maturityDate: '2038-08-25',
        nominee: 'अंजली शर्मा (पुत्री)',
        notes: 'किश्त देय है, ग्राहक को एसएमएस रिमाइंडर भेजा गया।',
        photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'LIC-1003',
        customerName: 'सुनीता देवी (Sunita Devi)',
        phone: '9765432109',
        policyNo: '654321098',
        planName: 'Money Back 20 Yrs (920)',
        sumAssured: 300000,
        premiumAmount: 7800,
        frequency: 'Half-Yearly',
        status: 'active',
        dueDate: '2026-11-10',
        maturityDate: '2032-11-10',
        nominee: 'अनिल कुमार (पति)',
        notes: 'मनी बैक किश्त 2028 में प्राप्य है।',
        photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'LIC-1004',
        customerName: 'रमेश वर्मा (Ramesh Verma)',
        phone: '9934567890',
        policyNo: '543210987',
        planName: 'Jeevan Umang (Table 945)',
        sumAssured: 800000,
        premiumAmount: 38500,
        frequency: 'Yearly',
        status: 'lapsed',
        dueDate: '2025-12-01',
        maturityDate: '2050-12-01',
        nominee: 'प्रिया वर्मा (पत्नी)',
        notes: 'प्रीमियम 6 महीने से पेंडिंग, रिवाइवल के लिए संपर्क करें।',
        photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
        id: 'LIC-1005',
        customerName: 'अमित पटेल (Amit Patel)',
        phone: '9898989898',
        policyNo: '432109876',
        planName: 'Tech Term Plan (854)',
        sumAssured: 15000000,
        premiumAmount: 16500,
        frequency: 'Yearly',
        status: 'active',
        dueDate: '2027-01-20',
        maturityDate: '2051-01-20',
        nominee: 'नेहा पटेल (पत्नी)',
        notes: 'ऑनलाइन टर्म प्लान, मेडिकल वेरिफिकेशन कम्प्लीट।',
        photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    }
];

// Memory cache + local JSON persistence if writable
let inMemoryStore = null;

const DATA_FILE = path.join('/tmp', 'lic_policies.json');

function loadPolicies() {
    if (inMemoryStore) return inMemoryStore;
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            inMemoryStore = JSON.parse(raw);
            return inMemoryStore;
        }
    } catch (e) {
        console.error("Error reading temp file", e);
    }
    inMemoryStore = [...defaultPolicies];
    return inMemoryStore;
}

function savePolicies(policies) {
    inMemoryStore = policies;
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(policies, null, 2), 'utf8');
    } catch (e) {
        console.error("Could not write to file system in serverless environment", e);
    }
}

module.exports = (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    let policies = loadPolicies();

    if (req.method === 'GET') {
        const query = (req.query.q || '').toLowerCase().trim();
        const status = req.query.status || 'all';
        const plan = req.query.plan || 'all';

        let filtered = policies.map((item, idx) => ({ ...item, serialNo: idx + 1 }));

        if (query) {
            filtered = filtered.filter((p) => {
                const srStr = p.serialNo.toString();
                return srStr.includes(query) ||
                    p.customerName.toLowerCase().includes(query) ||
                    p.policyNo.toLowerCase().includes(query) ||
                    p.phone.toLowerCase().includes(query) ||
                    (p.nominee && p.nominee.toLowerCase().includes(query));
            });
        }

        if (status !== 'all') {
            filtered = filtered.filter(p => p.status === status);
        }

        if (plan !== 'all') {
            filtered = filtered.filter(p => p.planName.includes(plan));
        }

        return res.status(200).json({
            success: true,
            totalCount: policies.length,
            filteredCount: filtered.length,
            data: filtered
        });
    }

    if (req.method === 'POST') {
        const body = req.body;
        if (!body.customerName || !body.policyNo) {
            return res.status(400).json({ success: false, message: 'Customer Name and Policy No are required.' });
        }

        const newPolicy = {
            id: body.id || 'LIC-' + Date.now(),
            customerName: body.customerName,
            phone: body.phone || '',
            policyNo: body.policyNo,
            planName: body.planName || 'Endowment Plan (914)',
            sumAssured: parseFloat(body.sumAssured) || 0,
            premiumAmount: parseFloat(body.premiumAmount) || 0,
            frequency: body.frequency || 'Yearly',
            status: body.status || 'active',
            dueDate: body.dueDate || '',
            maturityDate: body.maturityDate || '',
            nominee: body.nominee || '',
            notes: body.notes || '',
            photo: body.photo || ''
        };

        policies.unshift(newPolicy);
        savePolicies(policies);

        return res.status(201).json({ success: true, message: 'Policy saved successfully', data: newPolicy });
    }

    if (req.method === 'PUT') {
        const body = req.body;
        if (!body.id) {
            return res.status(400).json({ success: false, message: 'Policy ID is required for update.' });
        }

        const idx = policies.findIndex(p => p.id === body.id);
        if (idx === -1) {
            return res.status(404).json({ success: false, message: 'Policy record not found.' });
        }

        policies[idx] = {
            ...policies[idx],
            ...body
        };

        savePolicies(policies);

        return res.status(200).json({ success: true, message: 'Policy updated successfully', data: policies[idx] });
    }

    if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Policy ID is required for deletion.' });
        }

        const initialLength = policies.length;
        policies = policies.filter(p => p.id !== id);

        if (policies.length === initialLength) {
            return res.status(404).json({ success: false, message: 'Policy ID not found.' });
        }

        savePolicies(policies);
        return res.status(200).json({ success: true, message: 'Policy deleted successfully.' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
};
