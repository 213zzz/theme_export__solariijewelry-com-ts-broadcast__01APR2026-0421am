if (!customElements.get('product-loyalty-points')) {
  class ProductLoyaltyPoints extends HTMLElement {
    connectedCallback() {
      this.productInfo = this.closest('product-info');
      this.pointsPerDollar = Number(this.dataset.pointsPerDollar) || 1;
      this.pointsNode = this.querySelector('[data-loyalty-points-count]');

      this.handleVariantChange = this.handleVariantChange.bind(this);

      this.updateFromSelectedVariant();

      if (window.subscribe && window.theme?.PUB_SUB_EVENTS?.variantChange) {
        this.variantChangeUnsubscriber = window.subscribe(
          window.theme.PUB_SUB_EVENTS.variantChange,
          this.handleVariantChange
        );
      }
    }

    disconnectedCallback() {
      this.variantChangeUnsubscriber?.();
    }

    handleVariantChange(event) {
      if (!this.productInfo || !event?.data) {
        return;
      }

      const eventSectionId = event.data.sectionId;
      const localSectionId =
        this.productInfo.dataset.originalSection ||
        this.productInfo.dataset.section;

      if (eventSectionId !== localSectionId) {
        return;
      }

      this.updatePoints(event.data.variant?.price);
    }

    updateFromSelectedVariant() {
      const selectedVariantNode = this.productInfo?.querySelector(
        'variant-selects [data-selected-variant]'
      );

      if (!selectedVariantNode) {
        return;
      }

      try {
        const variant = JSON.parse(selectedVariantNode.textContent);
        this.updatePoints(variant?.price);
      } catch (error) {
        // Silently fail — server-rendered value is already displayed
      }
    }

    updatePoints(priceCents) {
      if (!Number.isFinite(priceCents) || priceCents <= 0 || !this.pointsNode) {
        return;
      }

      const priceDollars = priceCents / 100;
      const points = Math.floor(priceDollars * this.pointsPerDollar);
      this.pointsNode.textContent = points;
    }
  }

  customElements.define('product-loyalty-points', ProductLoyaltyPoints);
}
