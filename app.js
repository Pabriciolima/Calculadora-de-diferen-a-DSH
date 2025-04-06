// Base de dados de fornecedores e suas porcentagens
const fornecedores = {
    'cummins': 28.15,
    'cummins filtros': 24.74,
    'cummins motores': 23.44,
    'eaton': 53.39,
    'frasle': 24.98,
    'master': 15.21,
    'meritor': 42.90,
    'mwm': 47.79
};

// Contador de cálculos
let calculationCount = 0;
let charts = {}; // Armazenar instâncias de gráficos

// Função para adicionar um novo cálculo
function addCalculation() {
    if (calculationCount >= 8) {
        showNotification('Você atingiu o limite de 8 cálculos simultâneos.', 'info');
        return;
    }
    
    calculationCount++;
    
    const container = document.getElementById('calculationsContainer');
    const div = document.createElement('div');
    div.className = 'calculation-box';
    div.id = `calculation-${calculationCount}`;
    
    div.innerHTML = `
        <div class="calculation-header">
            <h3 class="calculation-title"><i class="fas fa-calculator"></i> Cálculo #${calculationCount}</h3>
            <button onclick="removeCalculation(${calculationCount})" class="btn-danger" title="Remover cálculo">
                <i class="fas fa-trash"></i> Remover
            </button>
        </div>
        
        <div>
            <label for="fornecedor-${calculationCount}">Fornecedor DSH:</label>
            <select id="fornecedor-${calculationCount}" required>
                <option value="">Selecione um fornecedor</option>
                ${Object.keys(fornecedores).map(fornecedor => 
                    `<option value="${fornecedor}">${fornecedor} (${fornecedores[fornecedor]}%)</option>`
                ).join('')}
            </select>
        </div>
        
        <div>
            <label for="valor-${calculationCount}">Valor de Fábrica (R$):</label>
            <input type="number" id="valor-${calculationCount}" step="0.01" min="0" placeholder="Digite o valor" required>
        </div>
        
        <div>
            <label for="descricao-${calculationCount}">Descrição (opcional):</label>
            <input type="text" id="descricao-${calculationCount}" placeholder="Nome do item ou referência">
        </div>
        
        <button onclick="calculate(${calculationCount})" class="btn-primary">
            <i class="fas fa-calculate"></i> Calcular
        </button>
        
        <div id="resultado-${calculationCount}" class="result">
            <div id="result-content-${calculationCount}"></div>
            <canvas id="chart-${calculationCount}" class="comparison-chart"></canvas>
        </div>
    `;
    
    container.appendChild(div);
    
    // Animar a entrada do novo cálculo
    setTimeout(() => {
        div.style.opacity = '1';
    }, 10);
    
    // Rolagem suave para o novo cálculo
    div.scrollIntoView({ behavior: 'smooth' });
    
    // Mostrar dica para o primeiro cálculo
    if (calculationCount === 1) {
        setTimeout(() => {
            showNotification('💡 Dica: Você pode adicionar até 8 cálculos para comparar!', 'info');
        }, 1000);
    }
}

// Função para remover um cálculo
function removeCalculation(id) {
    const element = document.getElementById(`calculation-${id}`);
    if (element) {
        // Animação de saída
        element.style.transform = 'translateX(-100%)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.remove();
            calculationCount--;
            
            // Destruir gráfico associado
            if (charts[`chart-${id}`]) {
                charts[`chart-${id}`].destroy();
                delete charts[`chart-${id}`];
            }
            
            // Renumerar os cálculos restantes
            updateCalculationNumbers();
            
            // Mostrar confetti se não houver mais cálculos
            if (calculationCount === 0) {
                setTimeout(() => {
                    showNotification('Adicione um novo cálculo para começar!', 'info');
                    createConfetti();
                }, 300);
            }
        }, 300);
    }
}

// Função para renumerar os cálculos após remoção
function updateCalculationNumbers() {
    const calculations = document.querySelectorAll('.calculation-box');
    calculations.forEach((calc, index) => {
        const newNumber = index + 1;
        calc.id = `calculation-${newNumber}`;
        calc.querySelector('.calculation-title').innerHTML = `<i class="fas fa-calculator"></i> Cálculo #${newNumber}`;
        
        // Atualizar IDs dos elementos internos
        const elementsToUpdate = calc.querySelectorAll('[id*="-"]');
        elementsToUpdate.forEach(el => {
            const parts = el.id.split('-');
            el.id = `${parts[0]}-${newNumber}`;
        });
        
        // Atualizar onclick do botão de cálculo
        const calcBtn = calc.querySelector('.btn-primary');
        if (calcBtn) {
            calcBtn.setAttribute('onclick', `calculate(${newNumber})`);
        }
        
        // Atualizar onclick do botão de remover
        const removeBtn = calc.querySelector('.btn-danger');
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeCalculation(${newNumber})`);
        }
        
        // Atualizar gráfico se existir
        if (charts[`chart-${index + 1}`]) {
            const chart = charts[`chart-${index + 1}`];
            delete charts[`chart-${index + 1}`];
            charts[`chart-${newNumber}`] = chart;
        }
    });
}

// Função para realizar o cálculo
function calculate(id) {
    const fornecedorSelect = document.getElementById(`fornecedor-${id}`);
    const valorInput = document.getElementById(`valor-${id}`);
    const descricaoInput = document.getElementById(`descricao-${id}`);
    const resultadoDiv = document.getElementById(`resultado-${id}`);
    const resultContent = document.getElementById(`result-content-${id}`);
    const chartCanvas = document.getElementById(`chart-${id}`);
    
    if (!fornecedorSelect.value) {
        showNotification('Por favor, selecione um fornecedor.', 'warning');
        return;
    }
    
    if (!valorInput.value || parseFloat(valorInput.value) <= 0) {
        showNotification('Por favor, insira um valor válido maior que zero.', 'warning');
        return;
    }
    
    const porcentagem = fornecedores[fornecedorSelect.value];
    const valorOriginal = parseFloat(valorInput.value);
    const valorFinal = valorOriginal * (1 + porcentagem / 100);
    const diferenca = valorFinal - valorOriginal;
    const descricao = descricaoInput.value || "Item sem descrição";
    
    resultContent.innerHTML = `
        <strong>${descricao}</strong><br>
        <div class="result-value">R$ ${valorFinal.toFixed(2)}</div>
        <strong>Detalhes:</strong><br>
        • Fornecedor: ${fornecedorSelect.value}<br>
        • Valor Original: R$ ${valorOriginal.toFixed(2)}<br>
        • Porcentagem DSH: ${porcentagem}%<br>
        • Diferença: R$ ${diferenca.toFixed(2)}<br>
        <small>Cálculo realizado em ${new Date().toLocaleString()}</small>
    `;
    
    resultadoDiv.style.display = 'block';
    
    // Criar gráfico comparativo
    createComparisonChart(id, fornecedorSelect.value, valorOriginal, valorFinal);
    
    // Efeito visual
    resultadoDiv.style.animation = 'none';
    setTimeout(() => {
        resultadoDiv.style.animation = 'fadeIn 0.5s';
    }, 10);
    
    // Rolagem suave para o resultado
    resultadoDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Confetti para celebrar
    if (valorOriginal > 1000) {
        createConfetti();
    }
}

// Função para criar gráfico comparativo
function createComparisonChart(id, fornecedor, valorOriginal, valorFinal) {
    const ctx = document.getElementById(`chart-${id}`).getContext('2d');
    
    // Destruir gráfico anterior se existir
    if (charts[`chart-${id}`]) {
        charts[`chart-${id}`].destroy();
    }
    
    charts[`chart-${id}`] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Valor Original', 'Valor com DSH'],
            datasets: [{
                label: `Valores (${fornecedor})`,
                data: [valorOriginal, valorFinal],
                backgroundColor: [
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$ ' + value.toFixed(2);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'R$ ' + context.raw.toFixed(2);
                        }
                    }
                }
            }
        }
    });
    
    document.getElementById(`chart-${id}`).style.display = 'block';
}

// Função para criar efeito de confetti
function createConfetti() {
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#FF5722', '#9C27B0'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.animationDuration = Math.random() * 2 + 2 + 's';
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// Função para mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px';
    notification.style.backgroundColor = type === 'success' ? '#4CAF50' : type === 'warning' ? '#FFC107' : '#2196F3';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '1000';
    notification.style.animation = 'fadeIn 0.3s';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeIn 0.3s reverse';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Alternar modo escuro/claro
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('themeToggle').querySelector('i');
    
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('darkMode', 'enabled');
        showNotification('Modo noturno ativado!', 'info');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('darkMode', 'disabled');
        showNotification('Modo claro ativado!', 'info');
    }
}

// Verificar preferência de modo escuro
function checkDarkModePreference() {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        const icon = document.getElementById('themeToggle').querySelector('i');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
}

// Rolagem para o topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Evento para adicionar o primeiro cálculo ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar modo escuro
    checkDarkModePreference();
    
    // Adiciona o primeiro cálculo automaticamente
    addCalculation();
    
    // Configura o botão para adicionar novos cálculos
    document.getElementById('addCalculation').addEventListener('click', addCalculation);
    
    // Configura o botão de tema
    document.getElementById('themeToggle').addEventListener('click', toggleDarkMode);
    
    // Configura o botão de rolagem para o topo
    document.getElementById('scrollToTop').addEventListener('click', scrollToTop);
    
    // Mostrar o botão de rolagem quando o usuário rolar
    window.addEventListener('scroll', function() {
        const scrollBtn = document.getElementById('scrollToTop');
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // Mostrar mensagem de boas-vindas
    setTimeout(() => {
        showNotification('Bem-vindo à Calculadora DSH Premium! 🎉', 'success');
    }, 500);
});