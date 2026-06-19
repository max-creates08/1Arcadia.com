const loginForm = document.querySelector('#login-form');
const editorForm = document.querySelector('#availability-admin-form');
const passwordInput = document.querySelector('#manager-password');
const loginMessage = document.querySelector('#login-message');
const publishMessage = document.querySelector('#publish-message');
let managerPassword = '';

async function managerRequest(body) {
  const response = await fetch('/api/availability', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${managerPassword}`
    },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginMessage.textContent = '';
  managerPassword = passwordInput.value;
  const button = loginForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Signing in…';
  try {
    const values = await managerRequest({ action: 'verify' });
    ['almeria', 'courtyard', 'olive'].forEach((property) => {
      editorForm.elements[property].value = values[property] || '';
    });
    passwordInput.value = '';
    loginForm.hidden = true;
    editorForm.hidden = false;
  } catch (error) {
    managerPassword = '';
    loginMessage.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Sign in <span>→</span>';
  }
});

editorForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  publishMessage.textContent = '';
  publishMessage.classList.remove('success');
  const button = editorForm.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = 'Publishing…';
  try {
    await managerRequest({
      action: 'update',
      availability: {
        almeria: editorForm.elements.almeria.value.trim(),
        courtyard: editorForm.elements.courtyard.value.trim(),
        olive: editorForm.elements.olive.value.trim()
      }
    });
    publishMessage.textContent = 'Published successfully. The website is now up to date.';
    publishMessage.classList.add('success');
  } catch (error) {
    publishMessage.textContent = error.message;
  } finally {
    button.disabled = false;
    button.innerHTML = 'Publish to website <span>→</span>';
  }
});

document.querySelector('#sign-out').addEventListener('click', () => {
  managerPassword = '';
  editorForm.reset();
  editorForm.hidden = true;
  loginForm.hidden = false;
  loginMessage.textContent = '';
  passwordInput.focus();
});
