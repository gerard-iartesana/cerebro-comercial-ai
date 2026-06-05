export default function handler(req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Propuesta Aceptada - Gerard Fanals</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f5f5f7;
            color: #1d1d1f;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .card {
            background: #fff;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            max-width: 400px;
            width: 90%;
        }
        .icon {
            font-size: 60px;
            margin-bottom: 20px;
        }
        h1 {
            font-size: 1.5rem;
            margin: 0 0 10px 0;
        }
        p {
            font-size: 0.9rem;
            color: #86868b;
            line-height: 1.5;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            background: #0071e3;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🎉</div>
        <h1>¡Propuesta Aceptada!</h1>
        <p>Tus datos han sido enviados correctamente. En breve prepararemos el contrato de servicios y te lo enviaremos para su firma final.</p>
        <a href="https://gerardfanals.com" class="btn">Volver a la web</a>
    </div>
</body>
</html>
    `);
}
