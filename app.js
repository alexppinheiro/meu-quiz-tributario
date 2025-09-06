// Variáveis globais
let quizData = null;
let currentQuestion = 0;
let userAnswers = [];
let correctCount = 0;
let wrongCount = 0;
let timerInterval = null;
let startTime = null;
let isPaused = false;
let isReviewMode = false;
let reviewQuestions = [];

// Carregar questões do arquivo JSON
async function loadQuestions() {
    try {
        const response = await fetch('questoes.json');
        if (!response.ok) throw new Error('Erro ao carregar questões');
        
        quizData = await response.json();
        
        // Atualizar interface
        document.getElementById('quiz-title').textContent = quizData.titulo;
        document.getElementById('total-questions').textContent = quizData.questoes.length;
        document.getElementById('welcome-total').textContent = quizData.questoes.length;
        
        // Esconder loading
        document.getElementById('loading').style.display = 'none';
        
        console.log(`${quizData.questoes.length} questões carregadas com sucesso!`);
    } catch (error) {
        console.error('Erro ao carregar questões:', error);
        document.getElementById('loading').innerHTML = `
            <div style="color: #dc3545;">
                Erro ao carregar questões!<br>
                Verifique se o arquivo 'questoes.json' está na mesma pasta que este arquivo.
            </div>
        `;
    }
}

// Iniciar quiz
function startQuiz() {
    if (!quizData) {
        alert('As questões ainda não foram carregadas!');
        return;
    }
    
    // Resetar variáveis se não for modo revisão
    if (!isReviewMode) {
        currentQuestion = 0;
        userAnswers = [];
        correctCount = 0;
        wrongCount = 0;
    }
    
    // Esconder telas desnecessárias
    document.getElementById('welcome').style.display = 'none';
    document.getElementById('results').style.display = 'none';
    document.getElementById('question-container').classList.add('active');
    
    // Iniciar timer
    if (!startTime) {
        startTime = Date.now();
        startTimer();
    }
    
    // Carregar primeira questão
    loadQuestion();
    updateProgress();
}

// Carregar questão
function loadQuestion() {
    const questions = isReviewMode ? reviewQuestions : quizData.questoes;
    
    if (currentQuestion >= questions.length) {
        showResults();
        return;
    }
    
    const q = questions[currentQuestion];
    
    // Atualizar interface
    document.getElementById('question-number').textContent = `Questão ${currentQuestion + 1}`;
    document.getElementById('question-type').textContent = q.tipo || 'Geral';
    document.getElementById('question-text').innerHTML = q.pergunta;
    
    // Criar opções
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';
    
    Object.keys(q.opcoes).forEach(letter => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        optionDiv.onclick = () => selectOption(letter, q.id);
        optionDiv.innerHTML = `
            <div class="option-letter">${letter}</div>
            <div class="option-text">${q.opcoes[letter]}</div>
        `;
        optionsContainer.appendChild(optionDiv);
    });
    
    // Esconder explicação
    document.getElementById('explanation').classList.remove('show');
    
    // Atualizar botões de navegação
    document.getElementById('prev-btn').disabled = currentQuestion === 0;
    document.getElementById('next-btn').textContent = 
        currentQuestion === questions.length - 1 ? 'Finalizar' : 'Próxima →';
    
    // Se já foi respondida, mostrar resposta
    const existingAnswer = userAnswers.find(a => a.questionId === q.id);
    if (existingAnswer) {
        showAnswer(existingAnswer.selected, existingAnswer.correct, q.explicacao);
    }
}

// Selecionar opção
function selectOption(letter, questionId) {
    const questions = isReviewMode ? reviewQuestions : quizData.questoes;
    const q = questions[currentQuestion];
    
    // Verificar se já foi respondida
    if (userAnswers.find(a => a.questionId === questionId)) {
        return;
    }
    
    const isCorrect = letter === q.correta;
    
    // Salvar resposta
    userAnswers.push({
        questionId: questionId,
        questionIndex: currentQuestion,
        selected: letter,
        correct: q.correta,
        isCorrect: isCorrect
    });
    
    // Atualizar contadores
    if (isCorrect) {
        correctCount++;
    } else {
        wrongCount++;
    }
    
    // Atualizar estatísticas
    updateStats();
    
    // Mostrar resposta
    showAnswer(letter, q.correta, q.explicacao);
}

// Mostrar resposta
function showAnswer(selected, correct, explanation) {
    const options = document.querySelectorAll('.option');
    
    options.forEach(option => {
        const letter = option.querySelector('.option-letter').textContent;
        option.classList.add('disabled');
        
        if (letter === correct) {
            option.classList.add('correct');
        } else if (letter === selected && selected !== correct) {
            option.classList.add('incorrect');
        }
    });
    
    // Mostrar explicação
    const explanationDiv = document.getElementById('explanation');
    explanationDiv.innerHTML = `<strong>Explicação:</strong> ${explanation}`;
    explanationDiv.classList.add('show');
}

// Navegar entre questões
function nextQuestion() {
    const questions = isReviewMode ? reviewQuestions : quizData.questoes;
    
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion();
        updateProgress();
    } else {
        showResults();
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
        updateProgress();
    }
}

// Atualizar progresso
function updateProgress() {
    const questions = isReviewMode ? reviewQuestions : quizData.questoes;
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    
    document.getElementById('progress').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = 
        `Questão ${currentQuestion + 1} de ${questions.length}`;
}

// Atualizar estatísticas
function updateStats() {
    document.getElementById('answered-questions').textContent = userAnswers.length;
    document.getElementById('correct-questions').textContent = correctCount;
    document.getElementById('wrong-questions').textContent = wrongCount;
}

// Timer
function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = `${minutes}:${seconds}`;
        }
    }, 1000);
}

// Pausar/Continuar
function pauseQuiz() {
    isPaused = !isPaused;
    document.getElementById('pause-btn').textContent = isPaused ? 'Continuar' : 'Pausar';
}

// Mostrar resultados
function showResults() {
    clearInterval(timerInterval);
    
    // Calcular estatísticas
    const total = isReviewMode ? reviewQuestions.length : quizData.questoes.length;
    const percentage = Math.round((correctCount / total) * 100);
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    // Atualizar interface
    document.getElementById('question-container').classList.remove('active');
    document.getElementById('results').style.display = 'block';
    
    document.getElementById('final-correct').textContent = correctCount;
    document.getElementById('final-incorrect').textContent = wrongCount;
    document.getElementById('final-percentage').textContent = `${percentage}%`;
    document.getElementById('final-time').textContent = `${minutes}:${seconds}`;
    
    // Mostrar questões erradas
    showErrorList();
}

// Mostrar lista de erros
function showErrorList() {
    const errorList = document.getElementById('error-list');
    const wrongAnswers = userAnswers.filter(a => !a.isCorrect);
    
    if (wrongAnswers.length === 0) {
        errorList.innerHTML = '<p>Parabéns! Você acertou todas as questões!</p>';
        return;
    }
    
    errorList.innerHTML = '<h3>Questões Erradas:</h3>';
    
    wrongAnswers.forEach(answer => {
        const q = quizData.questoes.find(q => q.id === answer.questionId);
        errorList.innerHTML += `
            <div class="error-item">
                <strong>Questão ${answer.questionIndex + 1}:</strong> ${q.pergunta}<br>
                <span style="color: #dc3545;">Sua resposta: ${answer.selected}</span><br>
                <span style="color: #28a745;">Resposta correta: ${answer.correct}</span><br>
                <em>Explicação: ${q.explicacao}</em>
            </div>
        `;
    });
}

// Mostrar apenas erros
function showErrors() {
    const wrongAnswers = userAnswers.filter(a => !a.isCorrect);
    
    if (wrongAnswers.length === 0) {
        alert('Você não tem erros para revisar!');
        return;
    }
    
    // Criar modal ou tela com erros
    const errorText = wrongAnswers.map(answer => {
        const q = quizData.questoes.find(q => q.id === answer.questionId);
        return `Questão: ${q.pergunta}\nSua resposta: ${answer.selected}\nCorreta: ${answer.correct}\nExplicação: ${q.explicacao}\n`;
    }).join('\n---\n');
    
    // Copiar para clipboard
    navigator.clipboard.writeText(errorText).then(() => {
        alert(`${wrongAnswers.length} questões erradas copiadas para a área de transferência!`);
    });
}

// Refazer apenas erros
function reviewErrors() {
    const wrongAnswers = userAnswers.filter(a => !a.isCorrect);
    
    if (wrongAnswers.length === 0) {
        alert('Você não tem erros para revisar!');
        return;
    }
    
    // Preparar modo revisão
    isReviewMode = true;
    reviewQuestions = wrongAnswers.map(answer => 
        quizData.questoes.find(q => q.id === answer.questionId)
    );
    
    // Resetar para revisão
    currentQuestion = 0;
    userAnswers = [];
    correctCount = 0;
    wrongCount = 0;
    
    // Iniciar quiz de revisão
    startQuiz();
    
    alert(`Modo Revisão: ${reviewQuestions.length} questões para refazer`);
}

// Reiniciar quiz
function resetQuiz() {
    // Resetar tudo
    currentQuestion = 0;
    userAnswers = [];
    correctCount = 0;
    wrongCount = 0;
    startTime = null;
    isPaused = false;
    isReviewMode = false;
    reviewQuestions = [];
    
    // Limpar timer
    clearInterval(timerInterval);
    document.getElementById('timer').textContent = '00:00';
    
    // Resetar estatísticas
    updateStats();
    updateProgress();
    
    // Voltar para tela inicial
    document.getElementById('question-container').classList.remove('active');
    document.getElementById('results').style.display = 'none';
    document.getElementById('welcome').style.display = 'block';
    document.getElementById('progress').style.width = '0%';
    document.getElementById('progress-text').textContent = 'Clique em "Iniciar Quiz" para começar';
}

// Atalhos de teclado
document.addEventListener('keydown', (e) => {
    if (document.getElementById('question-container').classList.contains('active')) {
        if (e.key === 'ArrowRight') nextQuestion();
        if (e.key === 'ArrowLeft') previousQuestion();
        
        // Responder com teclas A, B, C, D
        const key = e.key.toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(key)) {
            const questions = isReviewMode ? reviewQuestions : quizData.questoes;
            const q = questions[currentQuestion];
            if (q && !userAnswers.find(a => a.questionId === q.id)) {
                selectOption(key, q.id);
            }
        }
    }
});

// Inicializar quando a página carregar
window.addEventListener('DOMContentLoaded', loadQuestions);
