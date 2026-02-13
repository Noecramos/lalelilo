export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidade</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: 13 de fevereiro de 2026</p>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Introdução</h2>
                        <p>
                            A Lalelilo (&quot;nós&quot;, &quot;nosso&quot;) opera a plataforma de gestão de varejo e
                            e-commerce acessível em lalelilo.vercel.app. Esta Política de Privacidade descreve
                            como coletamos, usamos e protegemos suas informações pessoais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Dados Coletados</h2>
                        <p>Podemos coletar os seguintes tipos de dados:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Nome, e-mail, telefone e CPF (para processamento de pedidos)</li>
                            <li>Endereço de entrega</li>
                            <li>Mensagens enviadas via WhatsApp, Instagram e Facebook Messenger</li>
                            <li>Dados de navegação e uso da plataforma</li>
                            <li>Informações de pagamento (processadas pela Getnet, não armazenamos dados de cartão)</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Uso dos Dados</h2>
                        <p>Utilizamos seus dados para:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Processar e entregar seus pedidos</li>
                            <li>Comunicação via canais de mensagens (WhatsApp, Instagram, Facebook)</li>
                            <li>Melhorar nossos serviços e experiência do usuário</li>
                            <li>Enviar notificações sobre pedidos e campanhas de marketing</li>
                            <li>Cumprir obrigações legais</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Integrações com Terceiros</h2>
                        <p>
                            Utilizamos serviços de terceiros para funcionalidades específicas:
                        </p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li><strong>Meta (Facebook/Instagram):</strong> Para recebimento e envio de mensagens via Messenger e Instagram Direct</li>
                            <li><strong>WhatsApp Business API:</strong> Para comunicação via WhatsApp</li>
                            <li><strong>Getnet:</strong> Para processamento seguro de pagamentos</li>
                            <li><strong>Supabase:</strong> Para armazenamento seguro de dados</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Segurança dos Dados</h2>
                        <p>
                            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados,
                            incluindo criptografia SSL/TLS, controle de acesso baseado em funções e
                            armazenamento seguro de senhas com bcrypt.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Seus Direitos (LGPD)</h2>
                        <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Acessar seus dados pessoais</li>
                            <li>Corrigir dados incompletos ou desatualizados</li>
                            <li>Solicitar a exclusão de seus dados</li>
                            <li>Revogar o consentimento a qualquer momento</li>
                            <li>Solicitar a portabilidade de seus dados</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Retenção de Dados</h2>
                        <p>
                            Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades
                            descritas nesta política, a menos que um período de retenção maior seja exigido
                            ou permitido por lei.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Contato</h2>
                        <p>
                            Para exercer seus direitos ou tirar dúvidas sobre esta política, entre em contato:
                        </p>
                        <p className="mt-2">
                            <strong>E-mail:</strong> noecramos@gmail.com<br />
                            <strong>Plataforma:</strong> lalelilo.vercel.app
                        </p>
                    </section>
                </div>

                <div className="mt-10 pt-6 border-t border-gray-200 text-center">
                    <img src="/noviapp-logo.png" alt="Noviapp" className="h-5 mx-auto mb-2 object-contain opacity-40" />
                    <p className="text-xs text-gray-400">
                        © 2026 Novix Online • Powered by Noviapp AI Systems ®
                    </p>
                </div>
            </div>
        </div>
    );
}
