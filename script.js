class TarotCard {
    constructor() {
        this.cards = [];
        this.selectedCard = null;
        this.cardDescriptions = {};
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
            return lines[2] || 'https://yourshopifyurl.com/collections/all'; // 第三行存储推荐链接
        } catch (error) {
            console.error(`Error loading recommendation link for card ${cardNumber}:`, error);
            return 'https://yourshopifyurl.com/collections/all';
        }
    }

    initResetButton() {
        const resetButton = document.querySelector('.reset-button');
        resetButton.addEventListener('click', () => this.reset());
    }

    init() {
        const container = document.querySelector('.cards-container');
        container.innerHTML = '';
        this.cards = [];
        
        const totalCards = 18;
        const fanAngle = 120;
        const angleStep = fanAngle / (totalCards - 1);
        const startAngle = -fanAngle / 2;

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
            const transform = `rotate(${angle}deg) translateY(-30px)`;
            card.style.transform = transform;
            
            // 记录卡片的原始位置和角度
            card.dataset.originalTransform = transform;
            card.dataset.angle = angle;
            
            // 添加悬停效果
            card.addEventListener('mouseenter', () => {
                if (card.dataset.isHovered) return;
                card.dataset.isHovered = 'true';
                
                const radians = angle * Math.PI / 180;
                const x = Math.sin(radians) * 30;
                const y = -Math.cos(radians) * 30 - 70;
                const hoverTransform = `rotate(${angle}deg) translate(${x}px, ${y}px)`;
                card.style.transform = hoverTransform;
                card.dataset.hoverTransform = hoverTransform;
            });

            card.addEventListener('mouseleave', () => {
                delete card.dataset.isHovered;
                card.style.transform = card.dataset.originalTransform;
                delete card.dataset.hoverTransform;
            });
            
            // 记录触摸起始位置
            let touchStartX = 0;
            let touchStartY = 0;
            let isDragging = false;

            // 触摸开始
            card.addEventListener('touchstart', (e) => {
                if (card.dataset.isHovered) return;
                
                // 记录起始触摸位置
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                isDragging = false;
                
                // 显示悬停效果
                card.dataset.isHovered = 'true';
                const angle = parseFloat(card.dataset.angle);
                const radians = angle * Math.PI / 180;
                const x = Math.sin(radians) * 30;
                const y = -Math.cos(radians) * 30 - 70;
                const hoverTransform = `rotate(${angle}deg) translate(${x}px, ${y}px)`;
                card.style.transform = hoverTransform;
                card.dataset.hoverTransform = hoverTransform;

                e.preventDefault();
            }, { passive: false });

            // 触摸移动
            card.addEventListener('touchmove', (e) => {
                if (!card.dataset.isHovered) return;
                
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                // 计算移动距离
                const deltaX = touchX - touchStartX;
                const deltaY = touchY - touchStartY;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                
                // 如果移动距离超过阈值，标记为拖动
                if (distance > 30) {  // 30px的阈值
                    isDragging = true;
                    
                    // 计算拖动方向是否与卡片角度一致
                    const angle = parseFloat(card.dataset.angle);
                    const radians = angle * Math.PI / 180;
                    const expectedX = Math.sin(radians);
                    const expectedY = -Math.cos(radians);
                    
                    // 计算拖动方向与预期方向的点积
                    const dragX = deltaX / distance;
                    const dragY = deltaY / distance;
                    const dotProduct = dragX * expectedX + dragY * expectedY;
                    
                    // 如果拖动方向基本一致，触发选卡
                    if (dotProduct > 0.5) {  // 允许45度的误差
                        const currentTransform = card.dataset.hoverTransform;
                        this.selectCard(card, i + 1, currentTransform);
                        
                        // 清除触摸状态
                        delete card.dataset.isHovered;
                    }
                }
            });

            // 触摸结束
            card.addEventListener('touchend', () => {
                if (!isDragging) {
                    delete card.dataset.isHovered;
                    card.style.transform = card.dataset.originalTransform;
                    delete card.dataset.hoverTransform;
                }
            });

            card.addEventListener('touchcancel', () => {
                delete card.dataset.isHovered;
                card.style.transform = card.dataset.originalTransform;
                delete card.dataset.hoverTransform;
            });

            // 移除点击事件，改为完全依赖触摸交互
            card.removeEventListener('click', null);
            
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
        
        // 将克隆卡片添加到 body，以便使用绝对定位
        document.body.appendChild(clone);
        card = clone;
        
        // 创建一个固定位置的容器
        const wrapper = document.createElement('div');
        wrapper.className = 'selected-card-wrapper';
        document.querySelector('.container').insertBefore(wrapper, document.querySelector('.instruction').parentNode);

        // 执行动画
        requestAnimationFrame(() => {
            // 直接移动到容器中心
            card.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            const wrapperRect = wrapper.getBoundingClientRect();
            const targetY = wrapperRect.top - wrapperRect.height * 0.3;
            card.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(2)';
            card.style.left = '50%';
            card.style.top = `${targetY}px`;
            
            // 翻转
            setTimeout(() => {
                card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                card.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(2) rotateY(180deg)';
                
                // 在翻转动画结束后显示提示文字
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
                // 隐藏提示文字
                document.querySelector('.instruction').style.display = 'none';
                
                // 显示文本框和商品推荐
                const cardReading = document.querySelector('.card-reading');
                cardReading.classList.remove('hidden');
                cardReading.style.display = 'block';
                
                // 加载并显示卡片描述
                const description = document.querySelector('.card-description');
                description.textContent = await this.loadCardDescription(cardNumber);
                description.classList.add('show');
                
                // 显示商品推荐
                setTimeout(() => {
                    const recommendations = document.querySelector('.product-recommendations');
                    const recommendationButton = recommendations.querySelector('.recommendation-button');
                    this.loadRecommendationLink(cardNumber).then(link => {
                        recommendationButton.href = link;
                    });
                    recommendations.classList.add('show');
                }, 500);
            }, { once: true });

            // 显示提示文字
            document.querySelector('.instruction').style.display = 'block';
            document.querySelector('.instruction').classList.remove('hidden');
        }, 1000);  // 在翻转动画完成后添加点击事件
    }

    reset() {
        // 先淡出所有元素
        this.cards.forEach(card => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
        });

        // 如果有选中的卡片，让它淡出并移除
        if (this.selectedCard) {
            this.selectedCard.style.transition = 'all 0.4s ease';
            this.selectedCard.style.opacity = '0';
        }

        setTimeout(() => {
            // 移除卡片容器
            const wrapper = document.querySelector('.selected-card-wrapper');
            if (wrapper) {
                wrapper.remove();
            }
            
            // 确保移除添加到 body 的卡片
            const selectedCard = document.querySelector('body > .card');
            if (selectedCard) {
                selectedCard.remove();
            }

            // 重置所有状态
            document.querySelector('.instruction').style.display = 'none';
            document.querySelector('.instruction').classList.add('hidden');
            
            const readingDiv = document.querySelector('.card-reading');
            readingDiv.style.display = 'none';
            readingDiv.classList.add('hidden');
            
            // 移动重置按钮回到原位置
            const footer = document.querySelector('footer');
            const resetButton = document.querySelector('.reset-button');
            footer.appendChild(resetButton);
            
            // 清除选中状态
            this.selectedCard = null;
            
            // 清空容器并重新初始化
            const container = document.querySelector('.cards-container');
            container.innerHTML = '';
            this.cards = [];
            
            // 重新初始化所有卡片
            this.init();
            
            // 确保滚动回顶部
            window.scrollTo(0, 0);
        }, 400);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TarotCard();
}); 