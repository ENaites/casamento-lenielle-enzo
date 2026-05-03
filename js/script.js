document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.querySelector('nav ul');

    toggle.addEventListener('click', () => {
        nav.classList.toggle('show');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('show');
        });
    });

    // FAQ Accordion
    const faqs = document.querySelectorAll('.faq-q');
    faqs.forEach(faq => {
        faq.addEventListener('click', () => {
            faq.classList.toggle('active');
            const answer = faq.nextElementSibling;
            if (faq.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = '0';
            }
        });
    });

    // Fade-in animations on scroll
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    // SUPABASE RSVP LOGIC
    // Atenção: Substitua as strings abaixo com a sua URL e ANON KEY do painel Supabase
    const supabaseUrl = 'https://hetenwentyrlcdewzecv.supabase.co/rest/v1/';
    const supabaseKey = 'sb_publishable_lH00cYmMUk5ei-DlBlvfVA_3dczc0GN';

    if (supabaseUrl.length > 5) {
        let cleanUrl = supabaseUrl.replace('/rest/v1/', '').replace('/rest/v1', '');
        const supabase = window.supabase.createClient(cleanUrl, supabaseKey);

        const searchBtn = document.getElementById('find-guest-btn');
        const nameInput = document.getElementById('guest-name');
        const statusMsg = document.getElementById('rsvp-status-message');
        const formContainer = document.getElementById('rsvp-form-container');
        const foundNameSpan = document.getElementById('found-guest-name');
        const submitBtn = document.getElementById('submit-rsvp-btn');
        const searchContainer = document.getElementById('rsvp-search-container');
        const multipleGuestsContainer = document.getElementById('multiple-guests-container');
        const guestSelectionList = document.getElementById('guest-selection-list');

        let currentGuestId = null;

        function loadGuestForm(guest) {
            currentGuestId = guest.id;
            statusMsg.textContent = "";
            if (searchContainer) searchContainer.style.display = 'none';
            if (multipleGuestsContainer) multipleGuestsContainer.style.display = 'none';
            formContainer.style.display = 'block';
            foundNameSpan.textContent = guest.name;
            
            if (guest.status === 'confirmado' || guest.status === 'recusado') {
                document.getElementById('guest-status').value = guest.status;
            }
            if (guest.phone) {
                document.getElementById('guest-phone').value = guest.phone;
            }
            if (guest.message) {
                document.getElementById('guest-message').value = guest.message;
            }
        }

        if (searchBtn) {
            if (nameInput) {
                nameInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        searchBtn.click();
                    }
                });
            }

            searchBtn.addEventListener('click', async () => {
                const searchName = nameInput.value.trim();
                if (!searchName) return;

                statusMsg.textContent = "Buscando...";
                statusMsg.style.color = "var(--white)";
                formContainer.style.display = 'none';
                if (multipleGuestsContainer) multipleGuestsContainer.style.display = 'none';
                if (guestSelectionList) guestSelectionList.innerHTML = '';

                const { data, error } = await supabase
                    .from('guests')
                    .select('*')
                    .ilike('name', `%${searchName}%`)
                    .order('name');

                if (error || !data || data.length === 0) {
                    statusMsg.textContent = "Nenhum convidado encontrado com esse nome.";
                    statusMsg.style.color = "#ffb3b3";
                } else {
                    const pendingGuests = data.filter(g => !g.status || g.status.toLowerCase() === 'pendente');
                    
                    if (pendingGuests.length === 0) {
                        statusMsg.textContent = "A resposta para este convite já foi enviada anteriormente.";
                        statusMsg.style.color = "#ffb3b3";
                    } else if (pendingGuests.length === 1) {
                        loadGuestForm(pendingGuests[0]);
                    } else {
                        statusMsg.textContent = "";
                        multipleGuestsContainer.style.display = 'block';
                        
                        pendingGuests.forEach(guest => {
                        const btn = document.createElement('button');
                        btn.textContent = guest.name;
                        btn.style.display = 'block';
                        btn.style.width = '100%';
                        btn.style.padding = '0.8rem';
                        btn.style.marginBottom = '0.5rem';
                        btn.style.border = 'none';
                        btn.style.borderRadius = '4px';
                        btn.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        btn.style.color = 'var(--white)';
                        btn.style.cursor = 'pointer';
                        btn.style.textAlign = 'left';
                        btn.style.fontSize = '1.1rem';
                        btn.style.transition = 'background-color 0.2s';
                        
                        btn.onmouseover = () => btn.style.backgroundColor = 'rgba(255,255,255,0.2)';
                        btn.onmouseout = () => btn.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        
                        btn.addEventListener('click', () => {
                            loadGuestForm(guest);
                        });
                        
                        guestSelectionList.appendChild(btn);
                    });
                }
                }
            });
        }

        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                const status = document.getElementById('guest-status').value;
                const phone = document.getElementById('guest-phone').value.trim();
                const msg = document.getElementById('guest-message').value;
                const phoneErrorMsg = document.getElementById('phone-error-msg');

                if (phoneErrorMsg) phoneErrorMsg.style.display = 'none';

                if (status === 'confirmado' && !phone) {
                    if (phoneErrorMsg) phoneErrorMsg.style.display = 'block';
                    return;
                }

                submitBtn.textContent = "Enviando...";
                submitBtn.disabled = true;

                const { error } = await supabase
                    .from('guests')
                    .update({ status: status, phone: phone, message: msg })
                    .eq('id', currentGuestId)

                if (error) {
                    alert("Ocorreu um erro ao enviar. Tente novamente.");
                    submitBtn.textContent = "Enviar Confirmação";
                    submitBtn.disabled = false;
                } else {
                    formContainer.innerHTML = "<h3 style='color:var(--white); padding: 10px 0;'>Obrigado! Sua resposta foi salva.</h3>";
                    if (status === 'confirmado') {
                        window.open('https://www.querodecasamento.com.br/lista-de-casamento/Lenielle-e-Enzo', '_blank');
                    }
                }
            });
        }
    }
});
