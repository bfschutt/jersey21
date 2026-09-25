// "Share Your 21 Story" wall: submits new stories to Supabase (they land
// as unapproved/pending) and displays the ones that have been approved.

(function () {
  const isConfigured =
    window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.startsWith('YOUR_') &&
    !window.SUPABASE_ANON_KEY.startsWith('YOUR_');

  const form = document.getElementById('story-form');
  const formStatus = document.getElementById('form-status');
  const wall = document.getElementById('story-wall');
  const wallStatus = document.getElementById('wall-status');
  const notConfiguredNotice = document.getElementById('not-configured-notice');

  if (!isConfigured) {
    if (notConfiguredNotice) notConfiguredNotice.style.display = 'block';
    if (form) form.style.display = 'none';
    if (wallStatus) wallStatus.textContent = '';
    return;
  }

  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

  async function loadStories() {
    if (!wall) return;
    wall.innerHTML = '';
    if (wallStatus) wallStatus.textContent = 'Loading stories…';

    const { data, error } = await client
      .from('stories')
      .select('name, sport, story, submitted_at')
      .eq('approved', true)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Could not load stories:', error);
      if (wallStatus) wallStatus.textContent = 'Could not load stories right now. Please try again later.';
      return;
    }

    if (!data || data.length === 0) {
      if (wallStatus) wallStatus.textContent = 'No stories published yet — be the first to share yours!';
      return;
    }

    if (wallStatus) wallStatus.textContent = '';
    data.forEach(s => {
      const card = document.createElement('article');
      card.className = 'story-card';
      const date = new Date(s.submitted_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      card.innerHTML = `
        <p class="story-text">${escapeHtml(s.story)}</p>
        <p class="story-byline">&mdash; ${escapeHtml(s.name)}${s.sport ? ', ' + escapeHtml(s.sport) : ''} &middot; ${date}</p>
      `;
      wall.appendChild(card);
    });
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      formStatus.textContent = '';

      // Honeypot: a hidden field real visitors never fill in.
      const honeypot = form.elements['website'];
      if (honeypot && honeypot.value.trim() !== '') {
        return; // silently drop likely-bot submissions
      }

      const name = form.elements['name'].value.trim();
      const sport = form.elements['sport'].value.trim();
      const story = form.elements['story'].value.trim();

      if (!name || !story) {
        formStatus.textContent = 'Please fill in your name and your story.';
        return;
      }
      if (story.length > 2000) {
        formStatus.textContent = 'Your story is a bit too long (2000 characters max). Please trim it down.';
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formStatus.textContent = 'Submitting…';

      const { error } = await client.from('stories').insert({
        name: name,
        sport: sport || null,
        story: story,
        approved: false
      });

      submitBtn.disabled = false;

      if (error) {
        console.error('Submission error:', error);
        formStatus.textContent = 'Something went wrong submitting your story. Please try again.';
        return;
      }

      form.reset();
      formStatus.textContent = 'Thanks! Your story has been submitted and will appear here once it’s reviewed.';
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  loadStories();
})();
