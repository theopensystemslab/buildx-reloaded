import React from 'react';
import css from "./page.module.css";

const AccessibilityStatement = () => {
  return (
    <div className={css.root}>
      <h1>Accessibility Statement for build.wikihouse.cc</h1>

      <p>Thank you for exploring this experimental tool. We appreciate your interest in the project – and in this prototype. However, we want to make it clear that, as a public prototype this website has not undergone formal accessibility testing, and there are many elements that may not be usable by individuals with accessibility needs.</p>

      <h2>Current Limitations:</h2>

      <div>
        <h3>1. Mouse Navigation Dependency:</h3>
        <p>Our prototype heavily relies on mouse navigation. Unfortunately, keyboard navigation is not supported yet, and the website is not compatible with screen readers.</p>
      </div>

      <div>
        <h3>2. Interactive 3D Challenges:</h3>
        <p>Developing interactive 3D elements poses unique challenges in terms of accessibility. We acknowledge that certain features may be inaccessible to users with varying needs.</p>
      </div>

      <div>
        <h3>3. No Text Descriptions:</h3>
        <p>This website contains visual elements, such as images or 3D designs that do not yet have text descriptions. This will make it impossible to be used by users who are blind or visually impaired.</p>
      </div>

      <h2>Our Commitment:</h2>

      <div>
        <h3>1. Open to Input and Suggestions:</h3>
        <p>We welcome input, suggestions, and help, especially from users with accessibility needs and experts in the field. Your feedback is invaluable in helping us improve the accessibility of our website.</p>
      </div>

      <div>
        <h3>2. Commitment to Accessibility Testing:</h3>
        <p>We are actively working towards conducting accessibility testing on our website. Identifying and addressing accessibility issues is a priority, and we are committed to making our platform more inclusive.</p>
      </div>

      <div>
        <h3>3. Ongoing Development:</h3>
        <p>Our website is a prototype, and we recognize the importance of making it accessible to all users. We are dedicated to ongoing development efforts to enhance accessibility features and ensure a more inclusive user experience.</p>
      </div>

      <h2>How You Can Help:</h2>

      <p>If you have feedback or suggestions for how we can make this tool more accessible in future, please reach out to us at enquiries@wikihouse.cc. Your insights will contribute to the ongoing development of the tool.</p>

    </div>
  )
}

export default AccessibilityStatement;
