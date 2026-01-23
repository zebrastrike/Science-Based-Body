document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("is-ready");

  const reveals = document.querySelectorAll(".reveal");
  reveals.forEach((el, index) => {
    el.style.setProperty("--delay", `${index * 80}ms`);
  });

  const accordionItems = document.querySelectorAll(".accordion-item");
  accordionItems.forEach((item) => {
    const trigger = item.querySelector(".accordion-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");
      accordionItems.forEach((panel) => panel.classList.remove("is-open"));
      if (!isOpen) {
        item.classList.add("is-open");
      }
    });
  });

  const modal = document.getElementById("coa-modal");
  if (!modal) return;

  const openButtons = document.querySelectorAll(".modal-open");
  const closeButtons = modal.querySelectorAll("[data-modal-close], .modal-close");

  const openModal = () => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
  };

  openButtons.forEach((btn) => btn.addEventListener("click", openModal));
  closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
});
