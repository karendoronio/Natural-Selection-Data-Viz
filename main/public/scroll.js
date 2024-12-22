document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".section");
  const dots = document.querySelectorAll(".dot");
  const sliderItems = document.querySelectorAll(".slider-item");
  const prevButtons = document.querySelectorAll(".prev-button");
  const nextButtons = document.querySelectorAll(".next-button");
  const topButtons = document.querySelectorAll(".top-button");
  let currentSectionIndex = 0;
  let isScrolling = false; // Prevent multiple scrolls at once

  // Function to update the active dot based on the current section
  const updateActiveDot = () => {
    dots.forEach((dot, index) => {
      if (index === currentSectionIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  };

  // Function to scroll to a specific section
  const scrollToSection = (index) => {
    if (index >= 0 && index < sections.length) {
      sections[index].scrollIntoView({ behavior: "smooth" });
      currentSectionIndex = index;
      updateActiveDot();
    }
  };

  // Function to scroll to the top of the page
  const scrollToTop = () => {
    scrollToSection(0);
  };

  // Handle wheel scroll
  const handleScroll = (event) => {
    if (isScrolling) return; // Prevent rapid-fire scrolling

    const threshold = 400; // Pixels user must scroll before snapping
    const scrollDirection = event.deltaY > 0 ? 1 : -1; // Determine scroll direction (down or up)
    const section = sections[currentSectionIndex];
    const sectionTop = section.getBoundingClientRect().top;

    // Only snap if the user scrolls past the threshold
    if (
        (scrollDirection === 1 && sectionTop <= -threshold && currentSectionIndex < sections.length - 1) || // Down
        (scrollDirection === -1 && sectionTop >= threshold && currentSectionIndex > 0) // Up
    ) {
      currentSectionIndex += scrollDirection; // Move to the next/previous section
      scrollToSection(currentSectionIndex);
      isScrolling = true;

      setTimeout(() => {
        isScrolling = false; // Allow scrolling again after delay
      }, 800); // Delay as needed
    }
  };

// Update the event listener to use the new logic
  window.addEventListener("wheel", handleScroll, { passive: false });

  // Add smooth scrolling when dots are clicked
  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      scrollToSection(index);
    });
  });

  // Add click event for slider items
  sliderItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      scrollToSection(index + 1); // Assuming slider items correspond to sections 1, 2, etc.
    });
  });

  // Add click events for navigation buttons
  prevButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      scrollToSection(currentSectionIndex - 1);
    });
  });

  nextButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      scrollToSection(currentSectionIndex + 1);
    });
  });

  topButtons.forEach((button) => {
    button.addEventListener("click", scrollToTop);
  });

  // Initial update for active dot
  updateActiveDot();
});
