export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Termos de Serviço</h1>
                <p className="text-sm text-gray-500 mb-8">Última atualização: 19 de fevereiro de 2026</p>

                <div className="space-y-6 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Aceitação dos Termos</h2>
                        <p>
                            Ao acessar e utilizar a plataforma Lalelilo (&quot;Plataforma&quot;), operada pela Novix Online,
                            você concorda com estes Termos de Serviço. Se você não concordar com qualquer parte destes termos,
                            não utilize a Plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Descrição do Serviço</h2>
                        <p>A Lalelilo é uma plataforma de gestão de varejo e e-commerce que oferece:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Catálogo de produtos e pedidos online</li>
                            <li>Comunicação omnichannel via WhatsApp, Instagram e Facebook Messenger</li>
                            <li>Gestão de clientes e leads (CRM)</li>
                            <li>Processamento de pagamentos via Getnet</li>
                            <li>Atendimento automatizado com inteligência artificial</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Uso da Plataforma</h2>
                        <p>Ao utilizar a Plataforma, você concorda em:</p>
                        <ul className="list-disc pl-6 mt-2 space-y-1">
                            <li>Fornecer informações verdadeiras e atualizadas</li>
                            <li>Não utilizar a Plataforma para fins ilegais ou prejudiciais</li>
                            <li>Não enviar mensagens de spam ou conteúdo ofensivo</li>
                            <li>Manter a confidencialidade de suas credenciais de acesso</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Comunicações via Mensagens</h2>
                        <p>
                            Ao interagir conosco via WhatsApp, Instagram ou Facebook Messenger, você consente
                            que suas mensagens sejam processadas para fins de atendimento e gestão de
                            relacionamento com o cliente. Podemos utilizar inteligência artificial para
                            auxiliar no atendimento, mas um atendente humano estará sempre disponível.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Propriedade Intelectual</h2>
                        <p>
                            Todo o conteúdo da Plataforma, incluindo textos, imagens, logotipos, design e
                            funcionalidades são de propriedade da Novix Online e estão protegidos por leis
                            de propriedade intelectual.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Limitação de Responsabilidade</h2>
                        <p>
                            A Novix Online não se responsabiliza por danos indiretos, incidentais ou
                            consequenciais decorrentes do uso da Plataforma. O serviço é fornecido
                            &quot;como está&quot;, sem garantias expressas ou implícitas.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Exclusão de Dados</h2>
                        <p>
                            Você pode solicitar a exclusão de seus dados pessoais a qualquer momento.
                            Para isso, entre em contato conosco em{' '}
                            <a href="mailto:noecramos@gmail.com" className="text-blue-600 hover:underline">noecramos@gmail.com</a>{' '}
                            ou utilize nossa <a href="/api/data-deletion" className="text-blue-600 hover:underline">página de exclusão de dados</a>.
                            Processaremos sua solicitação em até 30 dias úteis, conforme a LGPD.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Modificações</h2>
                        <p>
                            Reservamo-nos o direito de alterar estes Termos a qualquer momento.
                            As alterações entram em vigor após a publicação na Plataforma.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Contato</h2>
                        <p>
                            Para dúvidas sobre estes Termos de Serviço:
                        </p>
                        <p className="mt-2">
                            <strong>E-mail:</strong> noecramos@gmail.com<br />
                            <strong>Plataforma:</strong> lalelilo.vercel.app
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">10. Legislação Aplicável</h2>
                        <p>
                            Estes Termos são regidos pelas leis da República Federativa do Brasil.
                            Qualquer disputa será submetida ao foro da comarca de Olinda, Pernambuco.
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
