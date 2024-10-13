export const FeedbackExtension = {
    name: 'Feedback',
    type: 'response',
    match: ({ trace }) =>
      trace.type === 'ext_feedback' || trace.payload.name === 'ext_feedback',
    render: ({ trace, element }) => {
      const feedbackContainer = document.createElement('div');
      const textInput = document.querySelector('input[type="text"]');
      let feedbackGiven = false; // Variable, um zu überprüfen, ob Feedback abgegeben wurde

      if (textInput) textInput.disabled = true;

      feedbackContainer.innerHTML = `
        <style>
          .vfrc-feedback {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .vfrc-feedback--description {
            font-size: 0.8em;
            color: grey;
            pointer-events: none;
          }
          .vfrc-feedback--stars {
            display: flex;
          }
          .vfrc-feedback--star {
            font-size: 24px;
            cursor: pointer;
            color: grey;
            transition: color 0.3s ease;
          }
          .vfrc-feedback--star.selected {
            color: gold;
          }
          .vfrc-feedback--star.disabled {
            pointer-events: none;
          }
        </style>
        <div class="vfrc-feedback">
          <div class="vfrc-feedback--description">Hat das geholfen?</div>
          <div class="vfrc-feedback--stars">
            ${Array.from({ length: 5 })
              .map(
                (_, index) =>
                  `<span class="vfrc-feedback--star" data-feedback="${index + 1}">★</span>`
              )
              .join('')}
          </div>
        </div>
      `;

      const stars = feedbackContainer.querySelectorAll('.vfrc-feedback--star');

      // Funktion, um Sterne zu markieren
      const setStars = (feedback) => {
        stars.forEach((star, index) => {
          star.classList.toggle('selected', index < feedback);
        });
      };

      stars.forEach((star) => {
        star.addEventListener('mouseover', function () {
          if (!feedbackGiven) {
            const feedback = parseInt(this.getAttribute('data-feedback'));
            setStars(feedback);
          }
        });

        star.addEventListener('mouseout', function () {
          if (!feedbackGiven) {
            stars.forEach((s) => s.classList.remove('selected'));
          }
        });

        star.addEventListener('click', function () {
          const feedback = parseInt(this.getAttribute('data-feedback'));

          // Dauerhaft ausgewählte Sterne anzeigen und mouseout deaktivieren
          setStars(feedback);
          feedbackGiven = true;

          // Feedback an Voiceflow senden
          window.voiceflow.chat.interact({
            type: 'complete',
            payload: { feedback: feedback },
          });

          // Textinput nach Feedback aktivieren
          if (textInput) textInput.disabled = false;

          // Sterne deaktivieren und Feedback dauerhaft anzeigen
          stars.forEach((s, index) => {
            s.classList.add('disabled');
            s.classList.toggle('selected', index < feedback);
          });
        });
      });

      element.appendChild(feedbackContainer);
    },
  };

  // Export the extension globally
  window.FeedbackExtension = FeedbackExtension;




export const FormExtension = {
  name: 'Forms',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'Custom_Form' || trace.payload.name === 'Custom_Form',
  render: ({ trace, element }) => {
    const disableChatInputs = (isDisabled) => {
      const chatDiv = document.getElementById('voiceflow-chat');
      const shadowRoot = chatDiv?.shadowRoot;

      shadowRoot?.querySelectorAll('.vfrc-chat-input')?.forEach((input) => {
        input.disabled = isDisabled;
        input.style.pointerEvents = isDisabled ? 'none' : 'auto';
        input.style.opacity = isDisabled ? '0.5' : '';
      });

      shadowRoot?.querySelectorAll('.vfrc-send-button')?.forEach((button) => {
        button.disabled = isDisabled;
        button.style.pointerEvents = isDisabled ? 'none' : 'auto';
        button.style.opacity = isDisabled ? '0.5' : '';
      });
    };

    const formContainer = document.createElement('form');

    formContainer.innerHTML = `
      <style>
        label {
          font-size: 0.8em;
          color: #888;
        }
        input[type="text"], input[type="email"] {
          width: 100%;
          border: none;
          border-bottom: 0.5px solid rgba(0, 0, 0, 0.1);
          background: transparent;
          margin: 5px 0;
          outline: none;
          padding: 8px 0;
        }
        .invalid {
          border-color: red;
        }
        .submit {
          background: linear-gradient(to right, #2e6ee1, #2e7ff1);
          border: none;
          color: white;
          padding: 10px;
          border-radius: 5px;
          width: 100%;
          cursor: pointer;
        }
      </style>

      <label for="name">Name</label>
      <input type="text" class="name" name="name" required><br><br>

      <label for="email">Email</label>
      <input type="email" class="email" name="email" required pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$" title="Invalid email address"><br><br>

      <input type="submit" class="submit" value="Submit">
    `;

    const submitButton = formContainer.querySelector('.submit');
    const nameField = formContainer.querySelector('.name');
    const emailField = formContainer.querySelector('.email');

    const validateForm = () => {
      if (nameField.checkValidity() && emailField.checkValidity()) {
        submitButton.disabled = false;
      } else {
        submitButton.disabled = true;
      }
    };

    nameField.addEventListener('input', validateForm);
    emailField.addEventListener('input', validateForm);

    formContainer.addEventListener('submit', function (event) {
      event.preventDefault();

      if (!nameField.checkValidity() || !emailField.checkValidity()) {
        nameField.classList.add('invalid');
        emailField.classList.add('invalid');
        return;
      }

      submitButton.remove();
      disableChatInputs(false); // Re-enable chat inputs once form is submitted

      window.voiceflow.chat.interact({
        type: 'complete',
        payload: { name: nameField.value, email: emailField.value },
      });
    });

    element.appendChild(formContainer);

    disableChatInputs(true); // Disable chat inputs until form is submitted
  },
};

export const WaitingAnimationExtension = {
  name: 'WaitingAnimation',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_waitingAnimation' ||
    trace.payload.name === 'ext_waitingAnimation',
  render: async ({ trace, element }) => {
    window.vf_done = true
    await new Promise((resolve) => setTimeout(resolve, 250))

    const text = trace.payload?.text || 'Please wait...'
    const delay = trace.payload?.delay || 3000

    const waitingContainer = document.createElement('div')
    waitingContainer.innerHTML = `
      <style>
        .vfrc-message--extension-WaitingAnimation {
          background-color: transparent !important;
          background: none !important;
        }
        .waiting-animation-container {
          font-family: Arial, sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #fffc;
          display: flex;
          align-items: center;
        }
        .waiting-text {
          display: inline-block;
          margin-left: 10px;
        }
        .waiting-letter {
          display: inline-block;
          animation: shine 1s linear infinite;
        }
        @keyframes shine {
          0%, 100% { color: #fffc; }
          50% { color: #000; }
        }
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #fffc;
          border-top: 2px solid #CF0A2C;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <div class="waiting-animation-container">
        <div class="spinner"></div>
        <span class="waiting-text">${text
          .split('')
          .map((letter, index) =>
            letter === ' '
              ? ' '
              : `<span class="waiting-letter" style="animation-delay: ${
                  index * (1000 / text.length)
                }ms">${letter}</span>`
          )
          .join('')}</span>
      </div>
    `

    element.appendChild(waitingContainer)

    window.voiceflow.chat.interact({
      type: 'continue',
    })

    let intervalCleared = false
    window.vf_done = false

    const checkDoneInterval = setInterval(() => {
      if (window.vf_done) {
        clearInterval(checkDoneInterval)
        waitingContainer.style.display = 'none'
        window.vf_done = false
      }
    }, 100)

    setTimeout(() => {
      if (!intervalCleared) {
        clearInterval(checkDoneInterval)
        waitingContainer.style.display = 'none'
      }
    }, delay)
  },
}

export const DoneAnimationExtension = {
  name: 'DoneAnimation',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_doneAnimatiotion' ||
    trace.payload.name === 'ext_doneAnimation',
  render: async ({ trace, element }) => {
    window.vf_done = true
    await new Promise((resolve) => setTimeout(resolve, 250))

    window.voiceflow.chat.interact({
      type: 'continue',
    })
  },
}
