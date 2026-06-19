const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');
const navLinks = document.querySelectorAll('.nav-link');
const form = document.querySelector('#application-form');
const creditScore = document.querySelector('#credit-score');
const creditHelp = document.querySelector('#credit-help');
const formError = document.querySelector('#form-error');
const successCard = document.querySelector('#success-card');
const propertySelect = document.querySelector('#property-select');
const defaultAvailability = {
  almeria: '1 unit · Aug 1 · $1,495/mo',
  courtyard: 'No active rental listed',
  olive: 'No active rental listed'
};

function renderAvailability(values = defaultAvailability) {
  Object.entries(values).forEach(([property, status]) => {
    const badge = document.querySelector(`[data-availability="${property}"]`);
    if (badge) {
      badge.textContent = status;
      badge.dataset.status = status.toLowerCase().replaceAll(' ', '-');
    }
  });
}

renderAvailability();

fetch('/api/availability')
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((values) => renderAvailability({ ...defaultAvailability, ...values }))
  .catch(() => {});

document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('input[name="moveIn"]').min = new Date().toISOString().split('T')[0];
document.querySelector('#finder-date').min = new Date().toISOString().split('T')[0];

document.querySelector('#home-finder').addEventListener('submit', (event) => {
  event.preventDefault();
  const selectedProperty = document.querySelector('#finder-property').value;
  const selectedDate = document.querySelector('#finder-date').value;
  document.querySelectorAll('[data-card-property]').forEach((card) => {
    card.classList.toggle('finder-match', Boolean(selectedProperty) && card.dataset.cardProperty === selectedProperty);
  });
  if (selectedProperty) propertySelect.value = selectedProperty;
  if (selectedDate) document.querySelector('input[name="moveIn"]').value = selectedDate;
  document.querySelector('#properties').scrollIntoView({ behavior: 'smooth' });
});

menuButton.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

navLinks.forEach((link) => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.property-select').forEach((button) => {
  button.addEventListener('click', () => {
    propertySelect.value = button.dataset.property;
    document.querySelector('#apply').scrollIntoView({ behavior: 'smooth' });
  });
});

function validateCredit() {
  const score = Number(creditScore.value);
  const isValid = creditScore.value !== '' && score >= 600 && score <= 850;
  creditScore.classList.toggle('invalid', !isValid && creditScore.value !== '');
  creditHelp.classList.toggle('error', !isValid && creditScore.value !== '');
  creditHelp.textContent = !isValid && creditScore.value !== ''
    ? 'A credit score of at least 600 is required to continue.'
    : 'A score of 600 or higher is required.';
  return isValid;
}

creditScore.addEventListener('input', validateCredit);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.textContent = '';

  if (!form.checkValidity()) {
    formError.textContent = 'Please complete all required fields with valid information.';
    form.reportValidity();
    return;
  }

  if (!validateCredit()) {
    formError.textContent = 'Applicants must have a credit score of 600 or higher.';
    creditScore.focus();
    return;
  }

  form.hidden = true;
  successCard.hidden = false;
  successCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('#reset-form').addEventListener('click', () => {
  form.reset();
  form.hidden = false;
  successCard.hidden = true;
  formError.textContent = '';
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
