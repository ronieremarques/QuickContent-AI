document.getElementById('articleForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Evita o envio padrão do formulário

    const email = document.getElementById('email').value;
    const keywords = document.getElementById('keywords').value.split('\n').filter(Boolean);

    // Validar email
    if (!email.endsWith('@blogger.com')) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'O e-mail deve terminar com "@blogger.com".',
        });
        return;
    }

    // Verifica se as palavras-chave não excedem 10
    if (keywords.length > 10) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Limite de 10 palavras-chave excedido.',
        });
        return;
    }

    Swal.fire({
        title: 'Aguarde...',
        text: 'Criando artigos...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Converte palavras-chave em uma string com parâmetros de consulta
    const query = keywords.map(kw => encodeURIComponent(kw)).join(',');
    const url = `http://blognetwork-api-extension.squareweb.app/api/createarticle?email=${encodeURIComponent(email)}&keywords=${query}`;

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro na requisição:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const { taskId } = data;

        // Verifica periodicamente o status da tarefa
        const checkStatus = async () => {
            const statusResponse = await fetch(`http://blognetwork.discloud.app/api/taskstatus/${taskId}`);
            const statusData = await statusResponse.json();
            
            if (statusData.status === 'completed') {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso!',
                    text: `Artigos criados: ${statusData.totalCreated}`,
                });
                return;
            } else if (statusData.status === 'failed') {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro',
                    text: 'Erro ao criar artigos.',
                });
                return;
            }
            
            setTimeout(checkStatus, 5000); // Verifica o status a cada 5 segundos
        };

        checkStatus();

    } catch (error) {
        console.error('Erro ao criar artigos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: error.message,
        });
    }
});
