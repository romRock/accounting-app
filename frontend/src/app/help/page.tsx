'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Keyboard, Book, Users, FileText, TrendingUp, Database, ArrowRightLeft, HelpCircle, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface AccordionItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleAccordion = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const moduleGuides: AccordionItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: <TrendingUp className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Overview of daily business activities and key metrics</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">What you see</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Total inward/outward amounts</li>
              <li>Daily commission earned</li>
              <li>Interactive charts (Line, Bar, Pie)</li>
              <li>Recent transactions</li>
              <li>Quick action forms</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>View KPI cards for quick insights</li>
              <li>Use date picker for specific day analysis</li>
              <li>Click refresh for latest data</li>
              <li>Add quick transactions from dashboard</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Manage inward & outward booking transactions</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Fill general information (ID, Date, Time, Center)</li>
              <li>Enter amount and commission details</li>
              <li>Add sender/receiver information</li>
              <li>Enter remarks if needed</li>
              <li>Click Save to add transaction</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Features</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Auto-commission calculation</li>
              <li>Search and filter transactions</li>
              <li>Edit existing entries</li>
              <li>Date-wise filtering</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'accounting',
      title: 'Accounting',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Record daily income and expense entries</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Select transaction type (Income/Expense)</li>
              <li>Add or select category</li>
              <li>Enter amount</li>
              <li>Add remarks</li>
              <li>Save entry</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Sections</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Accounts tab - View all entries</li>
              <li>Category tab - Manage categories</li>
              <li>Reports tab - Generate reports</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Analyze business data and generate insights</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Available Reports</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Transaction Report - All transactions summary</li>
              <li>Customer Report - Customer-wise analysis</li>
              <li>Centerwise Report - Center performance</li>
              <li>Amount Type Report - Cash vs Account analysis</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Select report type from dropdown</li>
              <li>Apply date filters if needed</li>
              <li>View generated report</li>
              <li>Export to PDF or Excel</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'balance-sheet',
      title: 'Balance Sheet',
      icon: <Database className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">View account-wise financial summary</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">What it shows</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Total Income by account</li>
              <li>Total Expense by account</li>
              <li>Net payable/receivable</li>
              <li>Account-wise balance</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Features</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Date range selection</li>
              <li>Export to PDF/Excel</li>
              <li>Account filtering</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'master',
      title: 'Master Data',
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Control system data and configurations</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Manage</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Users - Add system users</li>
              <li>Roles - Define user permissions</li>
              <li>Centers - Manage business centers</li>
              <li>Clients - Add customer data</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Select tab (Users/Roles/Centers/Clients)</li>
              <li>Fill form with required data</li>
              <li>Save to add new entry</li>
              <li>Edit existing entries by clicking rows</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'spl',
      title: 'SPL (Special Entry)',
      icon: <ArrowRightLeft className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-gray-900">Purpose</h4>
            <p className="text-gray-600">Handle Hawala/middleman transactions between two parties</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How it works</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Party A → Debit (sends money)</li>
              <li>Party B → Credit (receives money)</li>
              <li>System earns optional commission</li>
              <li>Creates dual accounting entries</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">How to use</h4>
            <ol className="list-decimal list-inside text-gray-600 space-y-1">
              <li>Select Party A (Debit party)</li>
              <li>Select Party B (Credit party)</li>
              <li>Enter amount</li>
              <li>Add commission if applicable</li>
              <li>Save to create entry</li>
            </ol>
          </div>
        </div>
      )
    }
  ];

  const faqs = [
    {
      question: "How to add a transaction?",
      answer: "Go to Transactions → fill form with details → click Save"
    },
    {
      question: "How to edit data?",
      answer: "Click on any row in the table → update the form → click Save"
    },
    {
      question: "Why data not showing?",
      answer: "Check filters applied or date selection. Try clearing filters or selecting correct date range"
    },
    {
      question: "Difference between Accounting & Transactions?",
      answer: "Accounting = income/expense entries | Transactions = booking flow (inward/outward)"
    },
    {
      question: "What is SPL?",
      answer: "Special Entry for middleman transactions between two parties with dual accounting effect"
    },
    {
      question: "Can I export reports?",
      answer: "Yes, PDF and Excel export options available in Reports and Balance Sheet pages"
    }
  ];

  return (
    <div className="bg-white min-h-screen w-full">
      <div className="pt-16 space-y-4 sm:space-y-6 p-6">
        
        {/* Header */}
        <div className="px-6">
          <h1 className="text-3xl font-bold text-gray-900">Help & User Guide</h1>
          <p className="text-gray-600 mt-1">Learn how to use the system efficiently</p>
        </div>

        {/* System Overview */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Book className="w-5 h-5" />
              System Overview
            </CardTitle>
            <CardDescription>What this system manages</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <ArrowRightLeft className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Transactions</h4>
                  <p className="text-sm text-gray-600">Inward/Outward bookings</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Accounting</h4>
                  <p className="text-sm text-gray-600">Income/Expense entries</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Reports</h4>
                  <p className="text-sm text-gray-600">Data analysis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-orange-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Balance Sheet</h4>
                  <p className="text-sm text-gray-600">Account summary</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Master Data</h4>
                  <p className="text-sm text-gray-600">Users, Clients, Centers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">SPL</h4>
                  <p className="text-sm text-gray-600">Special Hawala entries</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Navigation Guide */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Quick Navigation Guide
            </CardTitle>
            <CardDescription>Keyboard shortcuts for fast navigation</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">D</span>
                <span className="text-sm text-gray-700">Dashboard</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">T</span>
                <span className="text-sm text-gray-700">Transactions</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">A</span>
                <span className="text-sm text-gray-700">Accounting</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">B</span>
                <span className="text-sm text-gray-700">Balance Sheet</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">R</span>
                <span className="text-sm text-gray-700">Reports</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">M</span>
                <span className="text-sm text-gray-700">Master</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">S</span>
                <span className="text-sm text-gray-700">Special Entry</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">H</span>
                <span className="text-sm text-gray-700">Help</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Module-wise Guide */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Module-wise Guide</CardTitle>
            <CardDescription>Detailed instructions for each module</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              {moduleGuides.map((guide) => (
                <div key={guide.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleAccordion(guide.id)}
                    className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {guide.icon}
                      <span className="font-medium text-gray-900">{guide.title}</span>
                    </div>
                    {expandedItems.includes(guide.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {expandedItems.includes(guide.id) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      {guide.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Actions */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Common Actions</CardTitle>
            <CardDescription>Understanding button functions</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Save</h4>
                  <p className="text-sm text-gray-600">Add new entry to the system</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Update</h4>
                  <p className="text-sm text-gray-600">Edit selected entry</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Delete</h4>
                  <p className="text-sm text-gray-600">Remove entry permanently</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-gray-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Clear</h4>
                  <p className="text-sm text-gray-600">Reset form fields</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-purple-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Load</h4>
                  <p className="text-sm text-gray-600">Fetch filtered data</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Flow */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Data Flow</CardTitle>
            <CardDescription>How system data connects</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Accounting</h4>
                  <p className="text-sm text-gray-600">Income/Expense entries</p>
                  <div className="mt-2 text-xs text-blue-600">→ Feeds Reports & Balance Sheet</div>
                </div>
                <div className="hidden md:block text-gray-400">→</div>
                <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Transactions</h4>
                  <p className="text-sm text-gray-600">Booking operations</p>
                  <div className="mt-2 text-xs text-green-600">→ Operational entries</div>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">SPL</h4>
                  <p className="text-sm text-gray-600">Special middleman entries</p>
                  <div className="mt-2 text-xs text-purple-600">→ Affects both parties</div>
                </div>
                <div className="hidden md:block text-gray-400">→</div>
                <div className="flex-1 p-4 bg-white rounded-lg border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Master</h4>
                  <p className="text-sm text-gray-600">System configurations</p>
                  <div className="mt-2 text-xs text-orange-600">→ Controls all dropdowns</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h4 className="font-medium text-gray-900 mb-1">{faq.question}</h4>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Best Practices</CardTitle>
            <CardDescription>Recommended usage guidelines</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Verify amounts</h4>
                  <p className="text-sm text-gray-600">Always double-check amounts before saving</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Avoid duplicates</h4>
                  <p className="text-sm text-gray-600">Check for existing entries before adding</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Use correct categories</h4>
                  <p className="text-sm text-gray-600">Select appropriate categories for accurate reports</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Check dates</h4>
                  <p className="text-sm text-gray-600">Verify date selection before filtering</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="shadow-sm border-gray-200 bg-gray-100">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Page not loading</h4>
                  <p className="text-sm text-gray-600">→ Refresh the page and check internet connection</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Data mismatch</h4>
                  <p className="text-sm text-gray-600">→ Recheck entries and verify correct values</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900">Wrong entry</h4>
                  <p className="text-sm text-gray-600">→ Edit the entry or delete and re-add correctly</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
