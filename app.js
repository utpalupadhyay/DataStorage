document.addEventListener('DOMContentLoaded', () => {
    // --- State & API Config ---
    const STORAGE_KEY = 'lic_policies_data_v1';
    const API_ENDPOINT = '/api/policies';

    let policies = [];

    // --- DOM Elements ---
    const tableBody = document.getElementById('policy-table-body');
    const noDataMsg = document.getElementById('no-data-msg');
    
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterPlan = document.getElementById('filter-plan');
    
    const kpiTotalPolicies = document.getElementById('kpi-total-policies');
    const kpiActivePolicies = document.getElementById('kpi-active-policies');
    const kpiDuePolicies = document.getElementById('kpi-due-policies');
    const kpiTotalAssured = document.getElementById('kpi-total-assured');
    
    const btnAddNew = document.getElementById('btn-add-new');
    const btnExportCsv = document.getElementById('btn-export-csv');

    // Modals
    const modalForm = document.getElementById('modal-policy-form');
    const policyForm = document.getElementById('policy-form');
    const modalFormTitle = document.getElementById('modal-form-title');
    
    const modalCamera = document.getElementById('modal-camera');
    const cameraVideo = document.getElementById('camera-video');
    const cameraCanvas = document.getElementById('camera-canvas');
    const btnOpenCamera = document.getElementById('btn-open-camera');
    const btnCloseCamera = document.getElementById('btn-close-camera');
    const btnSnapPhoto = document.getElementById('btn-snap-photo');
    const photoFileInput = document.getElementById('photo-file-input');
    const photoPreviewImg = document.getElementById('photo-preview-img');
    const photoPreviewPlaceholder = document.getElementById('photo-preview-placeholder');
    const formPhotoData = document.getElementById('form-photo-data');

    const modalViewDetail = document.getElementById('modal-view-detail');

    let cameraStream = null;

    // Fetch data from API or localStorage
    const fetchPolicies = async () => {
        const query = searchInput.value.toLowerCase().trim();
        const status = filterStatus.value;
        const plan = filterPlan.value;

        try {
            const url = new URL(API_ENDPOINT, window.location.origin);
            if (query) url.searchParams.append('q', query);
            if (status !== 'all') url.searchParams.append('status', status);
            if (plan !== 'all') url.searchParams.append('plan', plan);

            const res = await fetch(url);
            if (res.ok) {
                const result = await res.json();
                policies = result.data || [];
                localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
            } else {
                throw new Error("Server returned non-200");
            }
        } catch (err) {
            console.warn("Using offline localStorage fallback:", err);
            policies = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        }

        renderTable();
        updateKPIs();
    };

    // --- KPI Dashboard Updater ---
    const updateKPIs = () => {
        kpiTotalPolicies.textContent = policies.length;
        kpiActivePolicies.textContent = policies.filter(p => p.status === 'active').length;
        kpiDuePolicies.textContent = policies.filter(p => p.status === 'due').length;
        
        const totalSum = policies.reduce((acc, p) => acc + (parseFloat(p.sumAssured) || 0), 0);
        kpiTotalAssured.textContent = '₹' + totalSum.toLocaleString('en-IN');
    };

    // --- Render Table with Serial Numbers ---
    const renderTable = () => {
        const query = searchInput.value.toLowerCase().trim();
        const statusVal = filterStatus.value;
        const planVal = filterPlan.value;

        tableBody.innerHTML = '';

        const filtered = policies.filter((p, index) => {
            const srNoStr = (index + 1).toString();
            const matchesSearch = srNoStr.includes(query) ||
                p.customerName.toLowerCase().includes(query) ||
                p.policyNo.toLowerCase().includes(query) ||
                p.phone.toLowerCase().includes(query);

            const matchesStatus = statusVal === 'all' || p.status === statusVal;
            const matchesPlan = planVal === 'all' || p.planName.includes(planVal);

            return matchesSearch && matchesStatus && matchesPlan;
        });

        if (filtered.length === 0) {
            noDataMsg.classList.remove('hidden');
        } else {
            noDataMsg.classList.add('hidden');

            filtered.forEach((p, idx) => {
                const serialNum = p.serialNo || (idx + 1);

                const tr = document.createElement('tr');

                const avatarHtml = p.photo 
                    ? `<img src="${p.photo}" alt="${p.customerName}" class="customer-avatar">`
                    : `<div class="customer-avatar">${p.customerName.charAt(0)}</div>`;

                tr.innerHTML = `
                    <td><span class="sr-no-badge">#${serialNum}</span></td>
                    <td>
                        <div class="customer-cell">
                            ${avatarHtml}
                            <div class="customer-info">
                                <div class="name">${p.customerName}</div>
                                <div class="phone">📱 ${p.phone}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="policy-num">${p.policyNo}</span></td>
                    <td><span class="plan-tag">${p.planName}</span></td>
                    <td><span class="amount">₹${Number(p.sumAssured).toLocaleString('en-IN')}</span></td>
                    <td>
                        <span class="amount">₹${Number(p.premiumAmount).toLocaleString('en-IN')}</span>
                        <span class="freq-label">${p.frequency}</span>
                    </td>
                    <td>${p.dueDate}</td>
                    <td>${p.maturityDate}</td>
                    <td><span class="status-badge ${p.status}">${getStatusLabel(p.status)}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="action-icon-btn btn-view" title="विवरण देखें" data-id="${p.id}">
                                <i data-lucide="eye"></i>
                            </button>
                            <button class="action-icon-btn btn-edit" title="एडिट करें" data-id="${p.id}">
                                <i data-lucide="edit-3"></i>
                            </button>
                            <button class="action-icon-btn delete btn-delete" title="हटाएं" data-id="${p.id}">
                                <i data-lucide="trash-2"></i>
                            </button>
                        </div>
                    </td>
                `;

                tableBody.appendChild(tr);
            });
        }

        lucide.createIcons();
        attachTableActionListeners();
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return '● Active (सक्रिय)';
            case 'due': return '● Due Soon (देय)';
            case 'lapsed': return '● Lapsed (लैप्स)';
            case 'matured': return '● Matured (पूरा)';
            default: return status;
        }
    };

    // --- Action Button Listeners in Table ---
    const attachTableActionListeners = () => {
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openDetailModal(id);
            });
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                openFormModal(id);
            });
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deletePolicy(id);
            });
        });
    };

    // --- Modal Open/Close Controls ---
    const openModal = (modal) => {
        modal.classList.add('active');
    };

    const closeModal = (modal) => {
        modal.classList.remove('active');
    };

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.close;
            const modal = document.getElementById(targetId);
            if (modal) closeModal(modal);
        });
    });

    [modalForm, modalCamera, modalViewDetail].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal);
                if (modal === modalCamera) stopCamera();
            }
        });
    });

    // --- Photo & Camera Functionality ---
    btnOpenCamera.addEventListener('click', async () => {
        openModal(modalCamera);
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            cameraVideo.srcObject = cameraStream;
        } catch (err) {
            console.error("Camera Access Error:", err);
            alert("कैमरा शुरू करने में समस्या आई! कृपया फाइल अपलोड का उपयोग करें।");
            closeModal(modalCamera);
        }
    });

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
    };

    btnCloseCamera.addEventListener('click', () => {
        stopCamera();
        closeModal(modalCamera);
    });

    btnSnapPhoto.addEventListener('click', () => {
        if (!cameraStream) return;
        const context = cameraCanvas.getContext('2d');
        cameraCanvas.width = cameraVideo.videoWidth || 320;
        cameraCanvas.height = cameraVideo.videoHeight || 240;
        context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
        
        const photoDataUrl = cameraCanvas.toDataURL('image/jpeg', 0.8);
        setPhotoPreview(photoDataUrl);
        
        stopCamera();
        closeModal(modalCamera);
    });

    photoFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPhotoPreview(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    const setPhotoPreview = (dataUrl) => {
        formPhotoData.value = dataUrl;
        photoPreviewImg.src = dataUrl;
        photoPreviewImg.classList.remove('hidden');
        photoPreviewPlaceholder.classList.add('hidden');
    };

    const resetPhotoPreview = () => {
        formPhotoData.value = '';
        photoPreviewImg.src = '';
        photoPreviewImg.classList.add('hidden');
        photoPreviewPlaceholder.classList.remove('hidden');
    };

    // --- Form Add / Edit Policy ---
    btnAddNew.addEventListener('click', () => {
        openFormModal();
    });

    const openFormModal = (id = null) => {
        policyForm.reset();
        resetPhotoPreview();

        if (id) {
            const policy = policies.find(p => p.id === id);
            if (policy) {
                modalFormTitle.innerHTML = `<i data-lucide="edit-3"></i> LIC पॉलिसी एडिट करें`;
                document.getElementById('form-policy-id').value = policy.id;
                document.getElementById('input-customer-name').value = policy.customerName;
                document.getElementById('input-phone').value = policy.phone;
                document.getElementById('input-policy-no').value = policy.policyNo;
                document.getElementById('input-plan-name').value = policy.planName;
                document.getElementById('input-sum-assured').value = policy.sumAssured;
                document.getElementById('input-premium-amount').value = policy.premiumAmount;
                document.getElementById('input-frequency').value = policy.frequency;
                document.getElementById('input-status').value = policy.status;
                document.getElementById('input-due-date').value = policy.dueDate;
                document.getElementById('input-maturity-date').value = policy.maturityDate;
                document.getElementById('input-nominee').value = policy.nominee || '';
                document.getElementById('input-notes').value = policy.notes || '';

                if (policy.photo) {
                    setPhotoPreview(policy.photo);
                }
            }
        } else {
            modalFormTitle.innerHTML = `<i data-lucide="user-plus"></i> नया LIC पॉलिसी रिकॉर्ड जोड़ें`;
            document.getElementById('form-policy-id').value = '';
        }

        lucide.createIcons();
        openModal(modalForm);
    };

    policyForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('form-policy-id').value;
        const payload = {
            id: id || 'LIC-' + Date.now(),
            customerName: document.getElementById('input-customer-name').value.trim(),
            phone: document.getElementById('input-phone').value.trim(),
            policyNo: document.getElementById('input-policy-no').value.trim(),
            planName: document.getElementById('input-plan-name').value,
            sumAssured: parseFloat(document.getElementById('input-sum-assured').value),
            premiumAmount: parseFloat(document.getElementById('input-premium-amount').value),
            frequency: document.getElementById('input-frequency').value,
            status: document.getElementById('input-status').value,
            dueDate: document.getElementById('input-due-date').value,
            maturityDate: document.getElementById('input-maturity-date').value,
            nominee: document.getElementById('input-nominee').value.trim(),
            notes: document.getElementById('input-notes').value.trim(),
            photo: formPhotoData.value || ''
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(API_ENDPOINT, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("API call failed");
        } catch (err) {
            console.warn("API Error, updating locally:", err);
            if (id) {
                const idx = policies.findIndex(p => p.id === id);
                if (idx !== -1) policies[idx] = payload;
            } else {
                policies.unshift(payload);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
        }

        closeModal(modalForm);
        fetchPolicies();
    });

    // --- Delete Policy ---
    const deletePolicy = async (id) => {
        const policy = policies.find(p => p.id === id);
        if (!policy) return;

        if (confirm(`क्या आप सचमुच "${policy.customerName}" (पॉलिसी नं: ${policy.policyNo}) का रिकॉर्ड हटाना चाहते हैं?`)) {
            try {
                await fetch(`${API_ENDPOINT}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            } catch (err) {
                console.warn("API delete failed, removing locally:", err);
                policies = policies.filter(p => p.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(policies));
            }
            fetchPolicies();
        }
    };

    // --- Detail View Modal ---
    const openDetailModal = (id) => {
        const policy = policies.find(p => p.id === id);
        if (!policy) return;

        const index = policies.indexOf(policy);
        document.getElementById('view-sr-no').textContent = `S.No. #${index + 1}`;
        document.getElementById('view-customer-name').textContent = policy.customerName;
        document.getElementById('view-phone').textContent = '📱 ' + policy.phone;
        document.getElementById('view-policy-no').textContent = policy.policyNo;
        document.getElementById('view-plan-name').textContent = policy.planName;
        document.getElementById('view-sum-assured').textContent = '₹' + Number(policy.sumAssured).toLocaleString('en-IN');
        document.getElementById('view-premium').textContent = `₹${Number(policy.premiumAmount).toLocaleString('en-IN')} (${policy.frequency})`;
        document.getElementById('view-due-date').textContent = policy.dueDate;
        document.getElementById('view-maturity-date').textContent = policy.maturityDate;
        document.getElementById('view-nominee').textContent = policy.nominee || 'कोई विवरण नहीं';
        document.getElementById('view-notes').textContent = policy.notes || 'कोई टिप्पणी नहीं';

        const statusBadge = document.getElementById('view-status-badge');
        statusBadge.className = `status-badge ${policy.status}`;
        statusBadge.textContent = getStatusLabel(policy.status);

        const avatarImg = document.getElementById('view-avatar');
        if (policy.photo) {
            avatarImg.src = policy.photo;
        } else {
            avatarImg.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(policy.customerName) + '&background=fbbf24&color=000';
        }

        openModal(modalViewDetail);
    };

    // --- Search & Filter Input Handlers ---
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(fetchPolicies, 300);
    });
    filterStatus.addEventListener('change', fetchPolicies);
    filterPlan.addEventListener('change', fetchPolicies);

    // --- CSV Export ---
    btnExportCsv.addEventListener('click', () => {
        if (policies.length === 0) {
            alert("निर्यात (Export) करने के लिए कोई डेटा उपलब्ध नहीं है!");
            return;
        }

        let csvContent = "\uFEFF";
        csvContent += "S.No.,Customer Name,Mobile,Policy No,Plan Name,Sum Assured (INR),Premium (INR),Frequency,Due Date,Maturity Date,Status,Nominee,Notes\n";

        policies.forEach((p, idx) => {
            const row = [
                idx + 1,
                `"${p.customerName.replace(/"/g, '""')}"`,
                `"${p.phone}"`,
                `"${p.policyNo}"`,
                `"${p.planName}"`,
                p.sumAssured,
                p.premiumAmount,
                `"${p.frequency}"`,
                `"${p.dueDate}"`,
                `"${p.maturityDate}"`,
                `"${p.status}"`,
                `"${(p.nominee || '').replace(/"/g, '""')}"`,
                `"${(p.notes || '').replace(/"/g, '""')}"`
            ];
            csvContent += row.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LIC_Policyholders_Report_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    });

    // Initial load
    fetchPolicies();
});
