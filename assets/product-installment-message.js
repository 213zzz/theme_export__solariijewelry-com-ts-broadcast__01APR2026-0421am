if (!customElements.get('product-installment-message')) {
  class ProductInstallmentMessage extends HTMLElement {
    static paypalPromise = null;

    connectedCallback() {
      this.productInfo = this.closest('product-info');
      this.installmentCount = Number(this.dataset.installmentCount) || 4;
      this.currencyCode = (this.dataset.currencyCode || 'USD').trim();
      this.moneyWithCurrency = this.dataset.moneyWithCurrency === 'true';
      this.paypalClientId = (this.dataset.paypalClientId || '').trim();
      this.amountNodes = this.querySelectorAll('[data-installment-amount]');
      this.openButtons = this.querySelectorAll('[data-installment-open]');
      this.modals = Array.from(this.querySelectorAll('[data-installment-modal]'));
      this.modalMap = new Map(this.modals.map((modal) => [modal.dataset.installmentModal, modal]));
      this.paypalProvider = this.querySelector('[data-paypal-provider]');
      this.paypalContainer = this.querySelector('[data-paypal-message]');
      this.paypalFallback = this.querySelector('[data-paypal-fallback]');
      this.activeModal = null;
      this.currentPriceCents = 0;

      this.handleVariantChange = this.handleVariantChange.bind(this);
      this.handleKeydown = this.handleKeydown.bind(this);
      this.handleModalClick = this.handleModalClick.bind(this);

      this.mountModals();
      this.bindEvents();
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
      this.closeModal();

      this.openButtons.forEach((button) => {
        button.removeEventListener('click', button.__installmentOpenHandler);
      });

      this.modals.forEach((modal) => {
        modal.removeEventListener('click', this.handleModalClick);
        modal.remove();
      });

      document.removeEventListener('keydown', this.handleKeydown);
      document.documentElement.classList.remove('installment-modal-open');
      document.body.classList.remove('installment-modal-open');
    }

    mountModals() {
      this.modals.forEach((modal) => {
        if (modal.parentNode !== document.body) {
          document.body.appendChild(modal);
        }
      });
    }

    bindEvents() {
      this.openButtons.forEach((button) => {
        const handler = (event) => {
          event.preventDefault();
          button.blur();
          this.openModal(button.dataset.installmentOpen);
        };

        button.__installmentOpenHandler = handler;
        button.addEventListener('click', handler);
        button.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.openModal(button.dataset.installmentOpen);
          }
        });
      });

      this.modals.forEach((modal) => {
        modal.addEventListener('click', this.handleModalClick);
      });
    }

    handleModalClick(event) {
      if (event.target.closest('[data-installment-close]')) {
        this.closeModal();
      }
    }

    handleKeydown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    }

    openModal(provider) {
      const modal = this.modalMap.get(provider);

      if (!modal) {
        return;
      }

      this.closeModal();
      this.activeModal = modal;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
      });

      document.documentElement.classList.add('installment-modal-open');
      document.body.classList.add('installment-modal-open');
      document.addEventListener('keydown', this.handleKeydown);
    }

    closeModal() {
      if (!this.activeModal) {
        return;
      }

      this.activeModal.classList.remove('is-open');
      this.activeModal.setAttribute('aria-hidden', 'true');
      this.activeModal.hidden = true;
      this.activeModal = null;

      document.documentElement.classList.remove('installment-modal-open');
      document.body.classList.remove('installment-modal-open');
      document.removeEventListener('keydown', this.handleKeydown);
    }

    handleVariantChange(event) {
      if (!this.productInfo || !event?.data) {
        return;
      }

      const eventSectionId = event.data.sectionId;
      const localSectionId = this.productInfo.dataset.originalSection || this.productInfo.dataset.section;

      if (eventSectionId !== localSectionId) {
        return;
      }

      this.updateAmount(event.data.variant?.price);
    }

    updateFromSelectedVariant() {
      const selectedVariantNode = this.productInfo?.querySelector('variant-selects [data-selected-variant]');

      if (!selectedVariantNode) {
        return;
      }

      try {
        const variant = JSON.parse(selectedVariantNode.textContent);
        this.updateAmount(variant?.price);
      } catch (error) {
        console.warn('Failed to parse selected variant for installment message.', error);
      }
    }

    formatMoney(priceCents) {
      const amount = priceCents / 100;

      try {
        const formatted = new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency: this.currencyCode,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(amount);

        return this.moneyWithCurrency ? `${formatted} ${this.currencyCode}` : formatted;
      } catch (error) {
        const fallback = `$${amount.toFixed(2)}`;
        return this.moneyWithCurrency ? `${fallback} ${this.currencyCode}` : fallback;
      }
    }

    updateAmount(priceCents) {
      if (!Number.isFinite(priceCents) || priceCents <= 0) {
        return;
      }

      this.currentPriceCents = priceCents;

      const installmentCents = Math.round(priceCents / this.installmentCount);
      const formatted = this.formatMoney(installmentCents);

      this.amountNodes.forEach((node) => {
        node.textContent = formatted;
      });

      this.renderPayPalMessage();
    }

    async ensurePayPalSdk() {
      if (window.paypal?.Messages) {
        return;
      }

      if (!this.paypalClientId) {
        throw new Error('Missing PayPal client ID.');
      }

      if (!ProductInstallmentMessage.paypalPromise) {
        ProductInstallmentMessage.paypalPromise = new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(this.paypalClientId)}&components=messages&currency=${encodeURIComponent(this.currencyCode)}`;
          script.async = true;
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load PayPal messaging SDK.'));
          document.head.appendChild(script);
        });
      }

      return ProductInstallmentMessage.paypalPromise;
    }

    async renderPayPalMessage() {
      if (!this.paypalProvider || !this.paypalContainer) {
        return;
      }

      if (!this.currentPriceCents || !this.paypalClientId) {
        this.paypalProvider.hidden = true;
        if (this.paypalFallback) {
          this.paypalFallback.hidden = false;
        }
        return;
      }

      try {
        await this.ensurePayPalSdk();

        if (!window.paypal?.Messages) {
          this.paypalProvider.hidden = true;
          return;
        }

        this.paypalContainer.innerHTML = '';

        await window.paypal.Messages({
          amount: (this.currentPriceCents / 100).toFixed(2),
          pageType: 'product-details',
          style: {
            layout: 'text',
            logo: {
              type: 'inline'
            },
            text: {
              color: 'black'
            }
          }
        }).render(this.paypalContainer);

        this.paypalProvider.hidden = false;
        if (this.paypalFallback) {
          this.paypalFallback.hidden = true;
        }
      } catch (error) {
        this.paypalProvider.hidden = true;
        if (this.paypalFallback) {
          this.paypalFallback.hidden = false;
        }
        console.warn('Failed to render PayPal installment messaging.', error);
      }
    }
  }

  customElements.define('product-installment-message', ProductInstallmentMessage);
}
