class TarotCard {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.cardDescriptions = {};
        
        // 绑定方法到实例
        this.reset = this.reset.bind(this);
        
        this.init();
        this.initResetButton();
    }

    async loadCardDescription(cardNumber) {
        try {
            const response = await fetch(`./cards/${cardNumber}.txt`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const [name, description] = text.trim().split('\n');
            return `${name}：${description.trim()}`;
        } catch (error) {
            console.error(`Error loading card ${cardNumber} description:`, error);
            return '加载失败，请重试';
        }
    }

    async loadRecommendationLink(cardNumber) {
        try {
            const response = await fetch(`./cards/${cardNumber}.txt`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            const lines = text.trim().split('\n');
            return lines[2] || 'https://yourshopifyurl.com/collections/all';
        } catch (error) {
            console.error(`Error loading recommendation link for card ${cardNumber}:`, error);
            return 'https://yourshopifyurl.com/collections/all';
        }
    }

    initResetButton() {
        const footer = document.querySelector('footer');
        
        // 使用事件委托
        footer.addEventListener('click', (e) => {
            const resetButton = e.target.closest('.reset-button');
            if (resetButton) {
                e.preventDefault();
                e.stopPropagation();
                this.reset();
            }
        });

        footer.addEventListener('touchstart', (e) => {
            const resetButton = e.target.closest('.reset-button');
            if (resetButton) {
                e.preventDefault();
                e.stopPropagation();
                resetButton.classList.add('touched');
            }
        }, { passive: false });

        footer.addEventListener('touchend', (e) => {
            const resetButton = e.target.closest('.reset-button');
            if (resetButton) {
                e.preventDefault();
                e.stopPropagation();
                resetButton.classList.remove('touched');
                this.reset();
            }
        }, { passive: false });
    }

    init() {
        const container = document.querySelector('.cards-container');
        container.innerHTML = '';
        this.cards = [];
        
        const totalCards = 18;
        const fanAngle = 140;  // 扇形角度
        const angleStep = fanAngle / (totalCards - 1);
        const startAngle = -fanAngle / 2;
        const radius = 100;  // 基础半径
        const hoverDistance = 40;  // 基础悬停距离
        const xScale = 0.5;  // x方向位移缩放因子
        const yScale = 1.2;  // y方向位移增强因子

        for (let i = 0; i < totalCards; i++) {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="card-front">
                    <img src="images/tarot-${i + 1}.jpg" alt="Crystal Card ${i + 1}">
                </div>
                <div class="card-back"></div>
            `;
            
            const angle = startAngle + (angleStep * i);
            const transform = `rotate(${angle}deg) translateY(-${radius}px)`;
            card.style.transform = transform;
            
            card.dataset.originalTransform = transform;
            card.dataset.angle = angle;
            
            // 添加触摸事件处理
            card.addEventListener('touchstart', (e) => {
                if (card.dataset.isHovered) return;
                card.dataset.isHovered = 'true';
                card.dataset.touchStartX = e.touches[0].clientX;
                card.dataset.touchStartY = e.touches[0].clientY;
                
                const radians = angle * Math.PI / 180;
                const x = Math.sin(radians) * hoverDistance * xScale;
                const y = Math.cos(radians) * hoverDistance * yScale;
                const hoverTransform = `rotate(${angle}deg) translateY(-${radius + y}px) translateX(${x}px)`;
                card.style.transform = hoverTransform;
                card.dataset.hoverTransform = hoverTransform;

                e.preventDefault();
            }, { passive: false });

            // 添加触摸移动事件
            card.addEventListener('touchmove', (e) => {
                if (!card.dataset.isHovered) return;
                
                const touch = e.touches[0];
                const startX = parseFloat(card.dataset.touchStartX);
                const startY = parseFloat(card.dataset.touchStartY);
                const deltaX = touch.clientX - startX;
                const deltaY = touch.clientY - startY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                if (distance > 30) {  // 降低拖动阈值，使其更容易触发
                    const currentTransform = card.dataset.hoverTransform;
                    this.selectCard(card, i + 1, currentTransform);
                    delete card.dataset.isHovered;
                    delete card.dataset.touchStartX;
                    delete card.dataset.touchStartY;
                }
            });

            card.addEventListener('touchend', () => {
                delete card.dataset.isHovered;
                delete card.dataset.touchStartX;
                delete card.dataset.touchStartY;
                card.style.transform = card.dataset.originalTransform;
                delete card.dataset.hoverTransform;
            });

            card.addEventListener('touchcancel', () => {
                delete card.dataset.isHovered;
                delete card.dataset.touchStartX;
                delete card.dataset.touchStartY;
                card.style.transform = card.dataset.originalTransform;
                delete card.dataset.hoverTransform;
            });

            // 添加鼠标事件
            card.addEventListener('mouseenter', () => {
                if (card.dataset.isHovered) return;
                card.dataset.isHovered = 'true';
                
                const radians = angle * Math.PI / 180;
                // 计算向外的位移，调整 x 和 y 方向的比例
                const x = Math.sin(radians) * hoverDistance * xScale;  // 减少横向位移
                const y = Math.cos(radians) * hoverDistance * yScale;  // 增加纵向位移
                // 在原有位移基础上增加向外的位移
                const hoverTransform = `rotate(${angle}deg) translateY(-${radius + y}px) translateX(${x}px)`;
                card.style.transform = hoverTransform;
                card.dataset.hoverTransform = hoverTransform;
            });

            card.addEventListener('mouseleave', () => {
                delete card.dataset.isHovered;
                card.style.transform = card.dataset.originalTransform;
                delete card.dataset.hoverTransform;
            });

            card.addEventListener('click', (e) => {
                e.preventDefault();
                if (card.dataset.isHovered) {
                    const currentTransform = card.dataset.hoverTransform || card.dataset.originalTransform;
                    this.selectCard(card, i + 1, currentTransform);
                }
            });

            this.cards.push(card);
            container.appendChild(card);
        }
    }

    selectCard(card, cardNumber, currentTransform) {
        if (this.selectedCard) return;
        
        this.selectedCard = card;
        
        // 获取卡片当前位置
        const rect = card.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // 创建克隆卡片并保持在当前位置
        const clone = card.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.left = `${rect.left + window.pageXOffset}px`;
        clone.style.top = `${rect.top + scrollTop}px`;
        clone.style.transform = currentTransform;
        clone.style.zIndex = '100';
        
        // 将克隆卡片添加到 body
        document.body.appendChild(clone);
        card = clone;
        
        // 创建一个固定位置的容器
        const wrapper = document.createElement('div');
        wrapper.className = 'selected-card-wrapper';
        document.querySelector('.container').insertBefore(wrapper, document.querySelector('.instruction').parentNode);

        // 执行动画
        requestAnimationFrame(() => {
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            const wrapperRect = wrapper.getBoundingClientRect();
            const targetY = wrapperRect.top - wrapperRect.height * 0.3;
            card.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(2)';
            card.style.left = '50%';
            card.style.top = `${targetY}px`;
            
            setTimeout(() => {
                card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(2) rotateY(180deg)';
                
                setTimeout(() => {
                    document.querySelector('.instruction').style.display = 'block';
                    document.querySelector('.instruction').classList.remove('hidden');
                }, 500);
            }, 500);
        });
        
        // 其他卡片淡出效果
        this.cards.forEach(c => {
            if (c !== card) {
                c.style.transition = 'all 0.5s ease';
                c.style.opacity = '0';
                c.style.transform = `${c.style.transform} scale(0.8)`;
            }
        });

        setTimeout(() => {
            card.addEventListener('click', async () => {
                document.querySelector('.instruction').style.display = 'none';
                
                const cardReading = document.querySelector('.card-reading');
                cardReading.classList.remove('hidden');
                cardReading.style.display = 'block';
                
                const description = document.querySelector('.card-description');
                description.textContent = await this.loadCardDescription(cardNumber);
                description.classList.add('show');
                
                setTimeout(() => {
                    const recommendations = document.querySelector('.product-recommendations');
                    const recommendationButton = recommendations.querySelector('.recommendation-button');
                    this.loadRecommendationLink(cardNumber).then(link => {
                        recommendationButton.href = link;
                    });
                    recommendations.classList.add('show');
                }, 500);
            }, { once: true });

            document.querySelector('.instruction').style.display = 'block';
            document.querySelector('.instruction').classList.remove('hidden');
        }, 1000);
    }

    reset() {
        this.cards.forEach(card => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
        });

        if (this.selectedCard) {
            this.selectedCard.style.transition = 'all 0.4s ease';
            this.selectedCard.style.opacity = '0';
        }

        setTimeout(() => {
            const wrapper = document.querySelector('.selected-card-wrapper');
            if (wrapper) {
                wrapper.remove();
            }
            
            const selectedCard = document.querySelector('body > .card');
            if (selectedCard) {
                selectedCard.remove();
            }

            document.querySelector('.instruction').style.display = 'none';
            document.querySelector('.instruction').classList.add('hidden');
            
            const readingDiv = document.querySelector('.card-reading');
            readingDiv.style.display = 'none';
            readingDiv.classList.add('hidden');
            
            const footer = document.querySelector('footer');
            const resetButton = document.querySelector('.reset-button');
            footer.appendChild(resetButton);
            
            this.selectedCard = null;
            
            const container = document.querySelector('.cards-container');
            container.innerHTML = '';
            this.cards = [];
            
            this.init();
            
            window.scrollTo(0, 0);
        }, 400);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TarotCard();
}); 