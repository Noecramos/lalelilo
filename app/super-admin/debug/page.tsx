'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Input } from '@/components/ui';

export default function DebugPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [testResult, setTestResult] = useState<string>('');
    const [shopSlug, setShopSlug] = useState('lalelilo-centro');
    const [getMessageResult, setGetMessageResult] = useState('');

    useEffect(() => {
        checkSystem();
    }, []);

    const checkSystem = async () => {
        setLoading(true);
        try {
            // Check Environment
            const envRes = await fetch('/api/debug/messages');
            const envData = await envRes.json();

            setStatus(envData);
        } catch (e) {
            setTestResult('Failed to connect to debug API');
        } finally {
            setLoading(false);
        }
    };

    const runDbTest = async () => {
        setTestResult('Running DB Test...');
        try {
            // Try to create a test message
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_type: 'super-admin',
                    sender_id: 'DEBUG_TEST',
                    recipient_id: 'DEBUG_TEST',
                    content: 'System Check Message'
                })
            });
            const data = await res.json();

            if (data.success) {
                setTestResult('✅ Write Success. Message ID: ' + data.message.id);
                // Clean up? Maybe leave it for evidence.
            } else {
                setTestResult('❌ Write Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (e: any) {
            setTestResult('❌ Network/Server Error: ' + e.message);
        }
    };

    const testGetMessages = async (asAdmin: boolean) => {
        setGetMessageResult('Fetching...');
        try {
            const url = asAdmin
                ? `/api/messages?isAdmin=true&shopId=${shopSlug}`
                : `/api/messages?shopId=${shopSlug}`;

            const res = await fetch(url);
            const data = await res.json();

            setGetMessageResult(
                `Status: ${res.status}\n` +
                JSON.stringify(data, null, 2)
            );
        } catch (e: any) {
            setGetMessageResult('Error: ' + e.message);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <h1 className="text-2xl font-bold">System Diagnostics</h1>

            <Card title="Environment Check">
                {loading ? <p>Checking...</p> : (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span>Service Role Key Configured:</span>
                            {status?.hasServiceKey ?
                                <Badge variant="success">YES (Length: {status.keyLength})</Badge> :
                                <Badge variant="danger">NO / MISSING</Badge>
                            }
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Environment:</span>
                            <Badge variant="info">{status?.env}</Badge>
                        </div>
                    </div>
                )}
            </Card>

            <Card title="Database Connectivity & Table Check">
                <p className="mb-4 text-gray-600">This will attempt to write a message to the database.</p>
                <Button onClick={runDbTest} disabled={loading}>
                    Test Database Write
                </Button>
                {testResult && (
                    <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-200 font-mono text-sm whitespace-pre-wrap">
                        {testResult}
                    </div>
                )}
            </Card>

            <Card title="Message Retrieval Check">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Shop Slug or ID</label>
                        <Input
                            value={shopSlug}
                            onChange={(e) => setShopSlug(e.target.value)}
                            placeholder="e.g. lalelilo-centro"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => testGetMessages(false)} variant="outline">
                            Simulate Shop Fetch
                        </Button>
                        <Button onClick={() => testGetMessages(true)} variant="outline">
                            Simulate Super Admin Fetch
                        </Button>
                    </div>
                    {getMessageResult && (
                        <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-200 font-mono text-sm whitespace-pre-wrap max-h-60 overflow-auto">
                            {getMessageResult}
                        </div>
                    )}
                </div>
            </Card>

            <div className="mt-8">
                <h3 className="font-bold mb-2">Troubleshooting Guide:</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    <li>If <b>Service Role Key</b> is missing: Go to Vercel &gt; Settings &gt; Environment Variables and add <code>SUPABASE_SERVICE_ROLE_KEY</code>.</li>
                    <li>If <b>Write Failed</b> with "relation messages does not exist": You need to run the SQL migration table creation script in Supabase.</li>
                    <li>If <b>Write Failed</b> with other database errors: Check Supabase logs.</li>
                </ul>
            </div>
        </div>
    );
}
