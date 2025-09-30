import { DOCUMENT } from '@angular/common';
import {
  Inject,
  Injectable,
} from '@angular/core';

/**
 * Service to add UserWay accessibility widget to the application.
 * The widget provides accessibility features like screen reader support,
 * keyboard navigation enhancements, and various visual adjustments.
 */
@Injectable()
export class UserWayService {

  constructor(
    @Inject(DOCUMENT) private document: any,
  ) {
  }

  /**
   * Initialize the UserWay accessibility widget by injecting the script into the page.
   * This method should be called once when the application initializes on the client side.
   */
  initUserWay(): void {
    // Create and configure the UserWay script element
    const script = this.document.createElement('script');

    // Build the script content with full configuration
    script.innerHTML = `
      (function(d){
        var s = d.createElement("script");
        /* Widget configuration */
        s.setAttribute("data-widget_layout", "full");
        s.setAttribute("data-account", "u5BrWIqGkK");
        s.setAttribute("data-color", "#2C3D68");
        s.setAttribute("src", "https://cdn.userway.org/widget.js");
        (d.body || d.head).appendChild(s);
      })(document);
    `;

    // Append the script to the document body
    this.document.body.appendChild(script);

    // Also add the noscript fallback
    const noscript = this.document.createElement('noscript');
    noscript.innerHTML = 'Please ensure Javascript is enabled for purposes of <a href="https://userway.org">website accessibility</a>';
    this.document.body.appendChild(noscript);
  }
}