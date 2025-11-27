document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: escape HTML to avoid XSS
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Helper: compute simple initials for avatar from a name or email
  function initialsFor(label) {
    if (!label) return "";
    const name = String(label).trim();
    // If email, take the part before @
    const core = name.includes("@") ? name.split("@")[0] : name;
    const parts = core.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Reset select options before populating
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants section (handle object/string participants and add delete icon)
        const participantsList = Array.isArray(details.participants) ? details.participants : [];
        let participantsHTML = '<div class="participants-section">';
        participantsHTML += '<span class="participants-label">Participants:</span>';

        if (participantsList.length === 0) {
          participantsHTML += '<p class="info no-participants">No participants yet. Be the first to join!</p>';
        } else {
          const items = participantsList
            .map((p) => {
              const label = typeof p === 'string' ? p : p.name || p.email || JSON.stringify(p);
              const email = typeof p === 'string' ? p : p.email || label;
              return `<li class="participant-item" data-activity="${escapeHtml(name)}" data-email="${escapeHtml(email)}">` +
                `<span class="participant-avatar">${escapeHtml(initialsFor(label))}</span>` +
                `<span class="participant-name">${escapeHtml(label)}</span>` +
                `<span class="delete-icon" title="Remove participant">&#128465;</span>` +
                `</li>`;
            })
            .join('');
          participantsHTML += `<ul class="participants-list">${items}</ul>`;
        }
        participantsHTML += '</div>';

        activityCard.innerHTML = `
          <h4>${escapeHtml(name)}</h4>
          <p>${escapeHtml(details.description)}</p>
          <p><strong>Schedule:</strong> ${escapeHtml(details.schedule)}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
<<<<<<< HEAD
          ${participantsHtml}
=======
          ${participantsHTML}
>>>>>>> 7bed85b (feat: Add participant removal UI and backend, auto-refresh, and tests\n\n- Add delete icon next to participants and hide list bullets\n- Implement DELETE /activities/{activity_name}/unregister endpoint\n- Refresh activities list on signup and unregister actions\n- Add pytest tests for signup & unregister behavior and edge cases\n- Add testing dependencies to requirements.txt (pytest, httpx, pytest-asyncio, requests),)
        `;


        activitiesList.appendChild(activityCard);

        // Add delete icon event listeners after rendering
        setTimeout(() => {
          const deleteIcons = activityCard.querySelectorAll(".delete-icon");
          deleteIcons.forEach(icon => {
            icon.addEventListener("click", async (e) => {
              const li = e.target.closest(".participant-item");
              const activity = li.getAttribute("data-activity");
              const email = li.getAttribute("data-email");
              if (confirm(`Unregister ${email} from ${activity}?`)) {
                try {
                  const response = await fetch(`/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`, {
                    method: "DELETE"
                  });
                  const result = await response.json();
                  if (response.ok) {
                    messageDiv.textContent = result.message;
                    messageDiv.className = "success";
                    fetchActivities();
                  } else {
                    messageDiv.textContent = result.detail || "An error occurred";
                    messageDiv.className = "error";
                  }
                  messageDiv.classList.remove("hidden");
                  setTimeout(() => {
                    messageDiv.classList.add("hidden");
                  }, 5000);
                } catch (error) {
                  messageDiv.textContent = "Failed to unregister participant.";
                  messageDiv.className = "error";
                  messageDiv.classList.remove("hidden");
                }
              }
            });
          });
        }, 0);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
