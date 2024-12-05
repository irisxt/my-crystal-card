class CardAdmin {
    constructor() {
        this.cards = [];
        this.loadCards();
        this.initEventListeners();
    }

    async loadCards() {
        try {
            const response = await fetch('../data/cards.json');
            const data = await response.json();
            this.cards = data.cards;
            this.renderCardList();
        } catch (error) {
            console.error('Error loading cards:', error);
        }
    }

    renderCardList() {
        const container = document.querySelector('.card-list');
        container.innerHTML = this.cards.map(card => `
            <div class="card-item" data-id="${card.id}">
                <h3>${card.name}</h3>
                <p>${card.description.substring(0, 100)}...</p>
            </div>
        `).join('');
    }

    initEventListeners() {
        document.querySelector('.card-list').addEventListener('click', e => {
            const cardItem = e.target.closest('.card-item');
            if (cardItem) {
                this.editCard(cardItem.dataset.id);
            }
        });

        document.getElementById('cardForm').addEventListener('submit', e => {
            e.preventDefault();
            this.saveCard();
        });

        document.querySelector('.cancel').addEventListener('click', () => {
            this.hideEditor();
        });
    }

    editCard(id) {
        const card = this.cards.find(c => c.id === parseInt(id));
        if (card) {
            document.getElementById('cardId').value = card.id;
            document.getElementById('cardName').value = card.name;
            document.getElementById('cardDescription').value = card.description;
            document.querySelector('.card-editor').classList.remove('hidden');
        }
    }

    async saveCard() {
        const id = parseInt(document.getElementById('cardId').value);
        const name = document.getElementById('cardName').value;
        const description = document.getElementById('cardDescription').value;

        const cardIndex = this.cards.findIndex(c => c.id === id);
        if (cardIndex !== -1) {
            this.cards[cardIndex] = { id, name, description };
            await this.saveToFile();
            this.renderCardList();
            this.hideEditor();
        }
    }

    async saveToFile() {
        try {
            const response = await fetch('/api/save-cards', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ cards: this.cards })
            });
            if (!response.ok) throw new Error('Failed to save cards');
        } catch (error) {
            console.error('Error saving cards:', error);
            alert('保存失败，请重试');
        }
    }

    hideEditor() {
        document.querySelector('.card-editor').classList.add('hidden');
        document.getElementById('cardForm').reset();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new CardAdmin();
}); 