<?php

namespace App\Http\Controllers;

use App\Models\MasterKipas;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        try {
            $devices = MasterKipas::all();
        } catch (\Exception $e) {
            $devices = collect([]);
        }
        return view('dashboard', compact('devices'));
    }
}
